### What it does:
    - Generates calendar based on user input (Defaults to today's date). This accurately accounts for leap years.
    - Allows user created categories with colour coding, whilst checking for duplication.
        - Categories saved to localStorage and loaded in when planner is generated.
    - Categories can be assigned/removed from cells.
        - Cells saved to localStorage and loaded in when planner is generated.
        - Cells then can be filtered with dropdown box.
        - Cells can be removed by selecting corresponding category and selecting populated cell.
    - Clear all function resets categories and cells, clears localStorage.

### Known issues:
    - Poor formatting of cells with long string content.
    - Readability conflict for certain colour choices.

### Possible improvements:
    - Inefficient data structure and usage of storage.