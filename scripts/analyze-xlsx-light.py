#!/usr/bin/env python3
"""Lightweight XLSX analyzer for very large Google Sheets exports.

The Node parser is friendlier for normal workbooks, but some Google Sheets
exports contain hundreds of megabytes of sheet XML/shared strings. This script
streams the first worksheet and resolves only the strings needed for usable rows.
"""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
import zipfile
from collections import Counter
from typing import Any
from urllib.parse import urljoin
from xml.etree import ElementTree as ET


NS = "{http://schemas.openxmlformats.org/spreadsheetml/2006/main}"
MAX_DATA_ROWS = 10001
MAX_IDEA_ROWS = 10000

FIELD_ALIASES = {
    "tool_name": ["tool_name", "tool name", "name", "tool", "product", "product_name", "idea name", "idea_name"],
    "tool_url": ["tool_url", "tool url", "url", "link", "tool_link", "tool link", "website", "routes", "route", "path"],
    "topic": ["topic", "title", "reel_topic", "video_topic", "idea name", "idea_name"],
    "description": ["description", "about", "tool_description", "tool description", "details", "short description", "short_description"],
    "script": ["script", "video_script", "existing_script", "reel_script", "view script", "view_script"],
    "target_user": ["target_user", "target user", "audience", "user", "ideal_user", "target market", "target_market"],
    "main_benefit": ["main_benefit", "main benefit", "benefit", "value", "outcome", "demand signal", "demand_signal"],
    "language": ["language", "lang"],
    "category": ["category", "cluster"],
    "priority": ["priority"],
    "status": ["status"],
}


def normalize_header(value: Any) -> str:
    return re.sub(r"\s+", " ", re.sub(r"[_-]+", " ", str(value or "").strip().lower()))


def find_field(row: dict[str, str], canonical: str) -> str:
    entries = list(row.items())
    for alias in FIELD_ALIASES[canonical]:
        normalized_alias = normalize_header(alias)
        for key, value in entries:
            if normalize_header(key) == normalized_alias and value not in ("", None):
                return str(value).strip()
    return ""


def resolve_url(value: str, base_url: str) -> str:
    raw = str(value or "").strip()
    if not raw:
        return ""
    if re.match(r"^[a-z][a-z0-9+.-]*://", raw, re.I):
        return raw
    return urljoin(base_url or "", raw) if base_url else raw


def column_number(cell_ref: str) -> int:
    match = re.match(r"([A-Z]+)", cell_ref or "")
    number = 0
    for char in match.group(1) if match else "":
        number = number * 26 + ord(char) - 64
    return number


def text_from_inline(cell: ET.Element) -> str:
    inline = cell.find(f"{NS}is")
    if inline is None:
        return ""
    parts = []
    for node in inline.iter():
        if node.tag.endswith("}t") and node.text:
            parts.append(node.text)
    return "".join(parts)


def raw_cell_value(cell: ET.Element) -> tuple[str, Any] | None:
    cell_type = cell.attrib.get("t", "")
    value_node = cell.find(f"{NS}v")
    raw_value = "" if value_node is None else (value_node.text or "")
    if cell_type == "inlineStr":
        raw_value = text_from_inline(cell)
    if raw_value == "":
        return None
    if cell_type == "s" and raw_value.isdigit():
        return ("s", int(raw_value))
    return ("v", raw_value)


def decode_value(value: tuple[str, Any] | None, shared_strings: dict[int, str]) -> str:
    if value is None:
        return ""
    kind, raw = value
    return shared_strings.get(raw, "") if kind == "s" else str(raw)


def parse_sheet(zip_file: zipfile.ZipFile) -> tuple[list[dict[str, Any]], set[int], int, int, bool]:
    rows: list[dict[str, Any]] = []
    wanted_strings: set[int] = set()
    raw_row_count = 0
    stored_non_empty = 0
    capped = False

    with zip_file.open("xl/worksheets/sheet1.xml") as sheet:
        for _, row in ET.iterparse(sheet, events=("end",)):
            if not row.tag.endswith("}row"):
                continue

            raw_row_count += 1
            cells: dict[int, tuple[str, Any]] = {}
            has_value = False
            for cell in row.findall(f"{NS}c"):
                col = column_number(cell.attrib.get("r", ""))
                if not col:
                    continue
                cell_type = cell.attrib.get("t", "")
                value_node = cell.find(f"{NS}v")
                raw_value = "" if value_node is None else (value_node.text or "")
                if cell_type == "inlineStr":
                    raw_value = text_from_inline(cell)
                if raw_value == "":
                    continue
                has_value = True
                if cell_type == "s" and raw_value.isdigit():
                    index = int(raw_value)
                    wanted_strings.add(index)
                    cells[col] = ("s", index)
                else:
                    cells[col] = ("v", raw_value)

            if has_value:
                stored_non_empty += 1
                if len(rows) < MAX_DATA_ROWS:
                    rows.append({
                        "source_row_number": int(row.attrib.get("r", raw_row_count)),
                        "cells": cells,
                    })
                else:
                    capped = True

            row.clear()

    return rows, wanted_strings, raw_row_count, stored_non_empty, capped


def parse_shared_strings(zip_file: zipfile.ZipFile, wanted: set[int]) -> dict[int, str]:
    if not wanted:
        return {}
    found: dict[int, str] = {}
    index = -1
    with zip_file.open("xl/sharedStrings.xml") as shared:
        for _, item in ET.iterparse(shared, events=("end",)):
            if not item.tag.endswith("}si"):
                continue
            index += 1
            if index in wanted:
                parts = []
                for node in item.iter():
                    if node.tag.endswith("}t") and node.text:
                        parts.append(node.text)
                found[index] = "".join(parts)
                if len(found) == len(wanted):
                    break
            item.clear()
    return found


def parse_first_non_empty_row(zip_file: zipfile.ZipFile) -> tuple[int, dict[int, tuple[str, Any]], set[int]]:
    with zip_file.open("xl/worksheets/sheet1.xml") as sheet:
        for fallback_row_number, (_, row) in enumerate(ET.iterparse(sheet, events=("end",)), start=1):
            if not row.tag.endswith("}row"):
                continue
            cells: dict[int, tuple[str, Any]] = {}
            wanted_strings: set[int] = set()
            for cell in row.findall(f"{NS}c"):
                col = column_number(cell.attrib.get("r", ""))
                value = raw_cell_value(cell)
                if not col or value is None:
                    continue
                cells[col] = value
                if value[0] == "s":
                    wanted_strings.add(int(value[1]))
            if cells:
                row_number = int(row.attrib.get("r", fallback_row_number))
                row.clear()
                return row_number, cells, wanted_strings
            row.clear()
    return 0, {}, set()


def alias_columns(headers_by_col: dict[int, str], canonical: str) -> list[int]:
    aliases = {normalize_header(alias) for alias in FIELD_ALIASES[canonical]}
    return [
        col
        for col, header in headers_by_col.items()
        if normalize_header(header) in aliases
    ]


def analyze_ideas_only(input_path: str, base_url: str, limit: int = MAX_IDEA_ROWS) -> dict[str, Any]:
    with zipfile.ZipFile(input_path) as zip_file:
        header_row_number, header_cells, header_wanted = parse_first_non_empty_row(zip_file)
        header_strings = parse_shared_strings(zip_file, header_wanted) if "xl/sharedStrings.xml" in zip_file.namelist() else {}
        headers_by_col = {
            col: decode_value(value, header_strings)
            for col, value in header_cells.items()
        }
        name_cols = alias_columns(headers_by_col, "tool_name") or alias_columns(headers_by_col, "topic")
        url_cols = alias_columns(headers_by_col, "tool_url")
        status_cols = alias_columns(headers_by_col, "status")
        category_cols = alias_columns(headers_by_col, "category")
        priority_cols = alias_columns(headers_by_col, "priority")
        wanted_cols = set(name_cols[:1] + url_cols[:1] + status_cols[:1] + category_cols[:1] + priority_cols[:1])

        ideas: list[dict[str, Any]] = []
        wanted_strings: set[int] = set()
        capped = False
        scanned_rows = 0

        if wanted_cols:
            with zip_file.open("xl/worksheets/sheet1.xml") as sheet:
                for fallback_row_number, (_, row) in enumerate(ET.iterparse(sheet, events=("end",)), start=1):
                    if not row.tag.endswith("}row"):
                        continue
                    row_number = int(row.attrib.get("r", fallback_row_number))
                    if row_number <= header_row_number:
                        row.clear()
                        continue
                    scanned_rows += 1
                    picked: dict[int, tuple[str, Any]] = {}
                    for cell in row.findall(f"{NS}c"):
                        col = column_number(cell.attrib.get("r", ""))
                        if col not in wanted_cols:
                            continue
                        value = raw_cell_value(cell)
                        if value is None:
                            continue
                        picked[col] = value
                        if value[0] == "s":
                            wanted_strings.add(int(value[1]))
                    name_value = picked.get(name_cols[0]) if name_cols else None
                    if name_value is not None:
                        ideas.append({
                            "row": row_number,
                            "name_value": name_value,
                            "url_value": picked.get(url_cols[0]) if url_cols else None,
                            "status_value": picked.get(status_cols[0]) if status_cols else None,
                            "category_value": picked.get(category_cols[0]) if category_cols else None,
                            "priority_value": picked.get(priority_cols[0]) if priority_cols else None,
                        })
                    row.clear()
                    if len(ideas) >= limit:
                        capped = True
                        break

        shared_strings = parse_shared_strings(zip_file, wanted_strings) if wanted_strings and "xl/sharedStrings.xml" in zip_file.namelist() else {}

    tools = []
    for idea in ideas:
        name = decode_value(idea["name_value"], shared_strings).strip()
        if not name:
            continue
        tools.append({
            "row": idea["row"],
            "name": name,
            "url": resolve_url(decode_value(idea["url_value"], shared_strings), base_url) if idea.get("url_value") else "",
            "status": decode_value(idea.get("status_value"), shared_strings),
            "category": decode_value(idea.get("category_value"), shared_strings),
            "priority": decode_value(idea.get("priority_value"), shared_strings),
        })

    warnings = ["Only tool idea names were loaded."]
    if capped:
        warnings.append(f"Only first {limit} idea names were loaded.")
    if not tools:
        warnings.append("No idea-name rows detected.")

    return {
        "tools": tools,
        "analysis": {
            "input": os.path.abspath(input_path),
            "fileName": os.path.basename(input_path),
            "detectedToolRows": len(tools),
            "ideaOnlyMode": True,
            "scannedRows": scanned_rows,
            "headers": [headers_by_col[col] for col in sorted(headers_by_col)],
            "warnings": warnings,
        },
    }


def make_unique_headers(headers: list[str]) -> list[str]:
    seen: Counter[str] = Counter()
    unique = []
    for index, header in enumerate(headers):
        base = str(header or f"column_{index + 1}").strip() or f"column_{index + 1}"
        normalized = normalize_header(base)
        seen[normalized] += 1
        unique.append(base if seen[normalized] == 1 else f"{base}__{seen[normalized]}")
    return unique


def normalize_tool_row(row: dict[str, str], source_row_number: int, base_url: str, file_name: str) -> dict[str, Any]:
    tool_name = find_field(row, "tool_name")
    topic = find_field(row, "topic") or tool_name
    raw_url = find_field(row, "tool_url")
    return {
        "source_row_number": source_row_number,
        "tool_name": tool_name or topic or f"Tool Row {source_row_number}",
        "tool_url": resolve_url(raw_url, base_url),
        "tool_route": raw_url,
        "topic": topic,
        "description": find_field(row, "description"),
        "script": find_field(row, "script"),
        "target_user": find_field(row, "target_user"),
        "main_benefit": find_field(row, "main_benefit"),
        "language": find_field(row, "language"),
        "category": find_field(row, "category"),
        "priority": find_field(row, "priority"),
        "status": find_field(row, "status"),
        "source_file": file_name,
    }


def analyze(input_path: str, base_url: str, full_tools: bool = False) -> dict[str, Any]:
    with zipfile.ZipFile(input_path) as zip_file:
        raw_rows, wanted, raw_row_count, non_empty_row_count, capped = parse_sheet(zip_file)
        shared_strings = parse_shared_strings(zip_file, wanted) if "xl/sharedStrings.xml" in zip_file.namelist() else {}

    converted_rows: list[dict[str, Any]] = []
    for row in raw_rows:
        values = {
            col: shared_strings.get(value, "") if kind == "s" else str(value)
            for col, (kind, value) in sorted(row["cells"].items())
        }
        converted_rows.append({
            "source_row_number": row["source_row_number"],
            "values": values,
        })

    if not converted_rows:
        headers: list[str] = []
        tools: list[dict[str, Any]] = []
    else:
        header_cols = sorted(converted_rows[0]["values"])
        headers = make_unique_headers([converted_rows[0]["values"].get(col, "") for col in header_cols])
        tools = []
        for row in converted_rows[1:]:
            obj = {
                header: row["values"].get(col, "")
                for header, col in zip(headers, header_cols)
            }
            tool = normalize_tool_row(obj, row["source_row_number"], base_url, os.path.basename(input_path))
            if tool["tool_name"] or tool["tool_url"] or tool["topic"] or tool["description"] or tool["script"]:
                tools.append(tool)

    status_counts = Counter(tool["status"] or "Blank" for tool in tools)
    category_counts = Counter(tool["category"] or "Uncategorized" for tool in tools)
    warnings = ["Large workbook parsed with lightweight reader."]
    if capped:
        warnings.append(f"Only first {MAX_DATA_ROWS} non-empty rows were analyzed.")
    if any(not tool["tool_url"] for tool in tools):
        warnings.append("Some rows do not have a tool URL.")
    if any(not tool["description"] for tool in tools):
        warnings.append("Some rows do not have a description.")
    if not tools:
        warnings.append("No usable tool rows detected.")

    if full_tools:
        tools_output = [
            {
                **tool,
                "row": tool["source_row_number"],
                "name": tool["tool_name"],
                "url": tool["tool_url"],
            }
            for tool in tools
        ]
    else:
        tools_output = [
            {
                "row": tool["source_row_number"],
                "name": tool["tool_name"],
                "url": tool["tool_url"],
                "status": tool["status"],
                "category": tool["category"],
                "priority": tool["priority"],
            }
            for tool in tools
        ]

    return {
        "tools": tools_output,
        "analysis": {
            "input": os.path.abspath(input_path),
            "fileName": os.path.basename(input_path),
            "headers": headers,
            "columnCount": len(headers),
            "rawRowCount": raw_row_count,
            "nonEmptyRowCount": non_empty_row_count,
            "detectedToolRows": len(tools),
            "withUrl": sum(1 for tool in tools if tool["tool_url"]),
            "missingUrl": sum(1 for tool in tools if not tool["tool_url"]),
            "withDescription": sum(1 for tool in tools if tool["description"]),
            "withScript": sum(1 for tool in tools if tool["script"]),
            "statusCounts": dict(status_counts),
            "categoryCounts": dict(category_counts),
            "largeFileMode": True,
            "preview": [
                {
                    "row": tool["source_row_number"],
                    "name": tool["tool_name"],
                    "url": tool["tool_url"],
                    "description": tool["description"],
                    "script": tool["script"],
                    "status": tool["status"],
                    "category": tool["category"],
                }
                for tool in tools[:8]
            ],
            "warnings": warnings,
        },
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("input")
    parser.add_argument("--base-url", default="")
    parser.add_argument("--full-tools", action="store_true")
    parser.add_argument("--ideas-only", action="store_true")
    parser.add_argument("--ideas-limit", type=int, default=MAX_IDEA_ROWS)
    args = parser.parse_args()
    try:
        if args.ideas_only:
            print(json.dumps(analyze_ideas_only(args.input, args.base_url, max(1, args.ideas_limit)), ensure_ascii=False))
        else:
            print(json.dumps(analyze(args.input, args.base_url, args.full_tools), ensure_ascii=False))
        return 0
    except Exception as exc:  # noqa: BLE001 - CLI reports safe error JSON.
        print(json.dumps({"ok": False, "error": str(exc)}), file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
