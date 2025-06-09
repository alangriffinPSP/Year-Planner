What it does:
    -Generates calendar based on user input (Defaults to today's date). This accurately accounts for leap years.
    -Allows user created categories.
        -Categories saved to localStorage and loaded in when planner is generated.
    -Categories can be assigned/removed from cells
        -Cells saved to localStorage and loaded in when corresponding dropdown selection is made.
    -Clear all function resets categories and cells, clears localStorage.

What it doesn't do (yet):
    -Colour coding of categories not implemented.
    -Warning message on 'Clear All' to be added.

Known bugs:
    -Poor formatting of cells with content.
    -All cell content loads regardless of dropdown option selected.
    -If cell contains multiple entries, selecting new dropdown option shows previously removed data.