<!--
    Copyright (C) <2026>  <Karsten Wong>

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <https://www.gnu.org/licenses/>.

    license: GPL-3.0-or-later
-->

# Auto Test - Browser Version

A web-based quiz application for creating, managing, and taking interactive tests. No server or installation required — just open `index.html` in a browser.

## Installation
Download `.zip` file from GitHub and extract it to a folder of choice. It is recommended to keep all `.json` files (refer to below) in the same folder

## Quick Start

1. Open `index.html` in your web browser (recommend saving this page in preferred browser)
2. Select a pre-loaded sample module (French, Latin, etc., for testing) or import a `.json` file:
- Click **Create Test** to build your own and download the file (module)  as a `.json` file
- Alternatively, use `quizlet_import.py` to create a `.json` file using existing quizlet sets (if you are the owner of the set)
- You can also paste `sample_module.json` in your generative AI of choice to generate a test based on your requirements in that format, which will be compatible with this online tester.
3. Click on the test name to open the test
4. Select sections and configure test settings
5. Take the quiz and try the redemption round

## Features

### Quiz Engine
- **Multiple test modules** — load different subject tests with section-based organization
- **Customisable settings** — choose number of questions, randomise order, select specific sections
- **Real-time scoring** — track your score as you go, with visual progress bar
- **Redemption round** — retry questions you got wrong at the end of the test
- **Answer summary** — review all your answers with correct/incorrect feedback

### Test Creator
Create and edit tests entirely in the browser without writing code:

- **Add sections** — organise questions into named sections
- **Add questions** — inline forms for quick question/answer entry (hover to click the button to create/ insert questions)
- **Edit/delete questions** — modify or remove individual Q&A pairs
- **Reorder questions** — insert new questions at any position within a section
- **Rename sections** — click section names to rename them
- **Insert/split sections** — insert a new section before existing ones, or split a section into two at any point (hover to click the button to create/ insert sections)
- **Drag-free section merge** — removing a section automatically merges its questions into the section above
- **Vocab Mode** — automatically creates reversed sections (answer → question) for vocabulary practice
- **Save & Download** — saves to browser memory and downloads as a `.json` file

### Import & Export
- **Load custom JSON** — upload any valid test JSON file via the "Load Custom Module" button
- **Edit imported modules** — imported modules can be edited in the Test Creator and re-saved
- **Download as JSON** — all created or edited modules can be exported as standalone JSON files

### Quizlet Import (Python)
The included `quizlet_import.py` script converts Quizlet-style text into the quiz JSON format:

```bash
python quizlet_import.py
```

Edit the script's `main()` function to set your raw text, section names, and output filename. 

The raw text should be set by using the `export` function in Quizlet (only works you are the owner) and for `Between term and definition` use `\n` and for `Between rows` use `\n\n`. Finally copy the text and in the `quizlet_import.py` script do: 

```python
raw_text = """(text)"""
```

To rename the section (required) use:

```python
main_section_name = "(name, e.g. French to English)"
```
If you would like the script to generate a separate sections with Q&A pairs swapped (e.g. vocab test), use:

```python
vocab_mode = True
```
Then, specify:

```python
reversed_section_name = "(name, e.g. English to French)"
```

If `vocab_mode` is `False` then a separate reversed section will not be created and `reversed_section_name` can be left blank `''`.

Finally specify the output filename using:

```python
output_filename = "French Vocab.json"
```

The file will be saved to the folder where the `quizlet_import.py` script is in. 

You can also choose to print the json text in the terminal instead, by using:

```python
output_mode = "print" # instead of "save"
```
In which case  `output_filename` can be left blank `''`.

### Language Support
Special character buttons for typing accented letters in foreign languages:

- **French**: à, â, ä, é, è, ê, ë, ç, ù, û, ü, ô, ö, œ, æ, î, ï
- **Spanish**: á, é, í, ó, ú, ü, ñ, ¿, ¡
- **German**: ä, ö, ü, ß
- **Italian**: à, è, é, ì, ò, ù
- **Portuguese**: ã, õ, ç, á, é, í, ó, ú, â, ê, ô
- **Latin**: ā, ē, ī, ō, ū, ȳ, ă, ĕ, ĭ, ŏ, ŭ

Click any character button to insert it at the cursor position in the answer box.

## JSON Module Format

Modules are stored as JSON files with this structure:

```json
{
  "name": "Module Name",
  "settings": {
    "ask_no_qs_in_test": true,
    "no_qs_in_test": 10,
    "ask_random": true,
    "random": false,
    "ask_sections": true,
    "sections": ["Section 1"]
  },
  "question_dict": {
    "Section 1": [
      { "question": "Question text", "answer": "Answer" }
    ]
  }
}
```

The `name` field is optional and used for display in the module list.

## Files

- `index.html` — main application (open this in a browser)
- `style.css` — styling and responsive layout
- `script.js` — full application logic (quiz engine + test creator)
- `quizlet_import.py` — Python tool to convert Quizlet text to JSON
- `sample_module.json` — example JSON format reference
- `README.md` — this file 
- `license.txt` — GNU General Public License 3.0 full text

## Browser Compatibility

Chrome/Chromium (recommended), Firefox, Safari, Edge — any modern browser with JavaScript support.



## TODO:
1. Show questions which are incorrect in the first round but correct in the second in `Summary` page (currently indicated as correct)
2. Add more question types such as mutli-choice (currently achievable by typing `'A, B, C, D'` and specifying options on the question)

## Final remarks
Made partly with Github copilot and partly with OpenCode AI