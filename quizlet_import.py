"""
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
"""

import json
import os
from typing import List, Dict, Any, Optional


def parse_quizlet_text(text: str) -> List[Dict[str, str]]:
    blocks = [block.strip() for block in text.strip().split("\n\n") if block.strip()]
    qa_pairs = []

    for block in blocks:
        lines = block.splitlines()
        if len(lines) < 2:
            continue
        question = lines[0].strip()
        answer = lines[1].strip()
        qa_pairs.append({"question": question, "answer": answer})

    return qa_pairs


def build_quiz_json(
    qa_pairs: List[Dict[str, str]],
    section_name: Optional[str] = None,
    ask_no_qs_in_test: bool = True,
    ask_random: bool = True,
    ask_sections: bool = True,
    vocab_mode: bool = False,
    reverse_section_name: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Build JSON structure.

    - section_name: main section name for normal direction (question -> answer).
    - vocab_mode: if True, also create a reversed section (answer -> question).
    - reverse_section_name: name for the reversed section (required if vocab_mode=True).
    """
    if section_name is None:
        section_name = "Default Section"

    sections_list = [section_name] if ask_sections else []

    question_dict: Dict[str, List[Dict[str, str]]] = {
        section_name: qa_pairs
    }

    # Optionally build vocab-mode reversed section
    if vocab_mode:
        if reverse_section_name is None:
            reverse_section_name = "Reversed Vocab"

        # Build reversed QA list: question <- answer, answer <- question
        reversed_pairs = [
            {"question": item["answer"], "answer": item["question"]}
            for item in qa_pairs
        ]

        question_dict[reverse_section_name] = reversed_pairs

        if ask_sections:
            sections_list.append(reverse_section_name)

    number_of_questions = len(qa_pairs)

    data = {
        "settings": {
            "ask_no_qs_in_test": ask_no_qs_in_test,
            "no_qs_in_test": number_of_questions,
            "ask_random": ask_random,
            "random": False,
            "ask_sections": ask_sections,
            "sections": sections_list,
        },
        "question_dict": question_dict,
        "check_ans_function": {
            "description": "Optional custom answer checking function",
            "example": (
                "function(userAnswer) { "
                "return userAnswer.toLowerCase().trim() === "
                "correctAnswer.toLowerCase().trim(); }"
            ),
            "notes": (
                "If provided, this function will be used instead of the default "
                "case-insensitive comparison. The function receives the user's "
                "answer as input."
            ),
        },
    }

    return data


def save_quiz_json_to_script_dir(data: Dict[str, Any], filename: str) -> str:
    script_dir = os.path.dirname(os.path.realpath(__file__))

    if not filename.endswith(".json"):
        filename += ".json"

    full_path = os.path.join(script_dir, filename)

    with open(full_path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

    return full_path

def process_quizlet_text_and_save_json(raw_text: str, main_section_name: str, vocab_mode: bool, reversed_section_name: str, output_filename: str = "quizlet_import.json", output_mode: str = "print"):
    qa_pairs = parse_quizlet_text(raw_text)

   

    quiz_json = build_quiz_json(
        qa_pairs,
        section_name=main_section_name,
        vocab_mode=vocab_mode,                      # turn vocab mode on
        reverse_section_name=reversed_section_name,
    )
    if output_mode == "print":
        print(json.dumps(quiz_json, indent=2, ensure_ascii=False))
    else:
        saved_path = save_quiz_json_to_script_dir(quiz_json, output_filename)
        print(f"Saved quiz JSON to: {saved_path}")



def main():
    main_section_name = "French to English"
    vocab_mode = True
    reversed_section_name = "English to French"
    output_mode = "save"
    output_filename = "French Vocab.json"



    raw_text = """"""

    process_quizlet_text_and_save_json(raw_text, main_section_name, vocab_mode, reversed_section_name, output_filename, output_mode)

if __name__ == "__main__":
    main()