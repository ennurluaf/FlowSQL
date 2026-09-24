# FlowSQL

FlowSQL is a lightweight browser-based tool for turning MySQL-style stored procedures into visual flowcharts. It reads SQL procedure definitions, extracts control flow, and renders a diagram you can edit, theme, and export as an image or JSON representation.

This project is intentionally simple and dependency-free: it runs as a static HTML/CSS/JavaScript app, so you can open it locally without a build system or package installation.

## Overview

FlowSQL helps developers and database teams:

- Understand complex stored procedure logic at a glance
- Visualize IF / ELSEIF / ELSE branches and procedural flow
- Inspect SELECT, INSERT, UPDATE, DELETE, and SET statements in a structured layout
- Edit the generated flowchart manually on a canvas
- Export the final diagram to PNG, SVG, or JSON

The app is designed for procedural SQL and is especially useful for reviewing logic-heavy stored procedures before deployment or during code review.

## Features

- SQL input panel for pasted stored procedure code
- Automatic parser for CREATE PROCEDURE blocks
- Flowchart generation from control-flow statements and SQL actions
- Manual node creation for process, decision, and SQL operation nodes
- Drag-and-drop canvas editing and selection tools
- Multi-select, move, duplicate, rename, and type-change actions
- Undo / redo history
- Fit-to-screen and zoom controls
- Light and dark mode styling
- Canvas background and node theme customization
- PNG export, SVG export, and JSON save/load
- Example SQL loaded by default for quick testing

## Live app location

The website lives in the [flowchart-generator](flowchart-generator) directory and is served from its own static frontend:

- [flowchart-generator/index.html](flowchart-generator/index.html) — app shell and UI layout
- [flowchart-generator/css/styles.css](flowchart-generator/css/styles.css) — visual design and layout styling
- [flowchart-generator/js](flowchart-generator/js) — rendering, parser, geometry, interaction logic
- [flowchart-generator/data/example.sql](flowchart-generator/data/example.sql) — sample procedure used by the app

## Project structure

```text
FlowSQL/
├── README.md
├── flowchart-generator/
│   ├── index.html
│   ├── css/
│   │   └── styles.css
│   ├── data/
│   │   └── example.sql
│   └── js/
│       ├── draw.js
│       ├── generate.js
│       ├── geometry.js
│       ├── history.js
│       ├── init.js
│       ├── input.js
│       ├── layout.js
│       ├── main.js
│       ├── panel_resize.js
│       ├── panel.js
│       ├── parser.js
│       ├── save_load.js
│       ├── theme.js
│       ├── tools.js
│       ├── ui.js
│       └── zoom.js
└── .git/
```

## How to run locally

Because this is a static frontend, there is no package install or build step.

### Option 1: Local web server (recommended)

```bash
cd /workspaces/FlowSQL/flowchart-generator
python3 -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

### Option 2: Open directly in a browser

You can also open [flowchart-generator/index.html](flowchart-generator/index.html) directly in a browser, although a local server is recommended for the smoothest experience.

## Using the app

### 1. Paste a stored procedure

In the SQL panel, paste a procedure similar to:

```sql
CREATE PROCEDURE sp_loginUser (
    IN in_username VARCHAR(50),
    IN in_passwordHash VARCHAR(255),
    OUT out_userId INT,
    OUT out_result VARCHAR(30)
)
BEGIN
    IF v_userId IS NULL THEN
        SET out_result = 'NOT_FOUND';
    ELSEIF v_isLocked THEN
        SET out_result = 'LOCKED';
    ELSE
        SET out_result = 'SUCCESS';
    END IF;
END;
```

### 2. Generate the flowchart

Click the Generate Flowchart button. The parser extracts the procedure name, statements, and branching logic and builds a diagram on the canvas.

### 3. Edit the diagram

The canvas supports:

- Dragging nodes to reorganize the layout
- Connecting nodes with arrows using the Connect tool
- Selecting multiple nodes with a drag box
- Renaming nodes in place by double-clicking
- Editing properties from the Properties tab
- Changing node appearance from the Theme tab

### 4. Export or save your work

Use the header actions to:

- Save as PNG
- Save as SVG
- Save as JSON AST
- Load a previously saved JSON diagram

## Supported SQL patterns

The parser is tuned for MySQL-like stored procedure syntax, including:

- CREATE PROCEDURE ... BEGIN ... END
- IF / ELSEIF / ELSE / END IF blocks
- DECLARE statements
- SET assignments
- INSERT INTO ... VALUES ...
- UPDATE ... SET ... WHERE ...
- DELETE FROM ... WHERE ...
- SELECT ... INTO ... FROM ...

The app focuses on readable flow summarization rather than deeply validating all SQL dialect edge cases.

## Keyboard and mouse controls

The interface includes a set of interaction shortcuts:

- Drag node: move it
- Drag empty space: rubber-band select
- Drag selection: move group
- Double-click: rename inline
- Right-click: open context menu
- Connect + click: draw connection
- Scroll: zoom
- Space / middle mouse button: pan
- Ctrl + A: select all
- Delete: remove selection
- Ctrl + Z / Ctrl + Y: undo / redo

## Theme and customization

The Theme tab includes:

- Node color themes
- Canvas background color options
- Toggle for grid visibility
- Fit All view utility

The toolbar also includes a light/dark theme toggle for the full application shell.

## Implementation notes

This app is implemented as plain vanilla JavaScript and is organized by responsibility:

- [flowchart-generator/js/parser.js](flowchart-generator/js/parser.js) — parses SQL procedure syntax into an AST-like structure
- [flowchart-generator/js/layout.js](flowchart-generator/js/layout.js) — computes node positions and layout hierarchy
- [flowchart-generator/js/draw.js](flowchart-generator/js/draw.js) — renders the canvas and arrows
- [flowchart-generator/js/generate.js](flowchart-generator/js/generate.js) — builds the initial flowchart from parsed SQL
- [flowchart-generator/js/save_load.js](flowchart-generator/js/save_load.js) — exports PNG/SVG/JSON and loads saved content
- [flowchart-generator/js/theme.js](flowchart-generator/js/theme.js) — visual theme logic
- [flowchart-generator/js/history.js](flowchart-generator/js/history.js) — undo/redo management

This structure makes it fairly straightforward to extend the project with additional SQL patterns, diagram layouts, or export options.

## Example workflow

1. Load the sample procedure from [flowchart-generator/data/example.sql](flowchart-generator/data/example.sql)
2. Click Generate Flowchart
3. Review the decision branches in the diagram
4. Adjust node positions and labels for clarity
5. Export to SVG for documentation or PNG for sharing

## Troubleshooting

- No diagram appears: make sure the SQL input contains a valid CREATE PROCEDURE block
- Parser errors: verify the syntax is close to MySQL-style procedure syntax
- Export is blank: ensure the canvas contains at least one node before exporting
- UI layout feels cramped: use the panel resize handle or adjust browser zoom

## Notes

FlowSQL is a focused visualization tool rather than a full SQL IDE. It is best suited for understanding procedure logic and documenting flow clearly without requiring a separate diagramming suite.
