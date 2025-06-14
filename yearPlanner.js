// --- KNOWN BUGS ---
//All cells load at the same time, not on corresponding selection
//Colours can be defined multiple times across different categories
//If cell contains multiple entries, changing dropdown selection shows previously removed data


// --- TO DO ---

//Change how data is stored in cells. DON'T save entire HTML string to storage
//Implement colour indicator dot
//Allow multiple different entries per day
//Show/hide categories depending on dropdown selection
//Tidy code


$(document).ready(function () {

    const initialise = {
        //sets datepicker to today's date
        pageElements() {
            document.getElementById('date').valueAsDate = new Date();
        },

        reset() {
            if (confirm("Are you sure?")) {
                localStorage.clear();
                $('#category').val('');
                $('#dropdown option:not(:first)').remove();
                $('td').attr('class', 'dayCell').css('background-color', 'var(--bgcolor)');
                $('.userData').remove();
                $('#colorIndicator').hide();
            } else {
                return;
            }
        }
    }

    const storageControl = {
        saveCategories(title, color) {
            let categories = JSON.parse(localStorage.getItem('Categories')) || [];
            categories.push({ Title: title, Color: color });

            localStorage.setItem('Categories', JSON.stringify(categories));
        },

        loadCategories() {
            const savedCategories = JSON.parse(localStorage.getItem('Categories'));

            if (savedCategories) {
                const categoryPairs = savedCategories.map(function (obj) {
                    return [obj.Title, obj.Color];
                })
                for (let i = 0; i < categoryPairs.length; i++) {
                    //Loads user categories into dropdown
                    $('#dropdown').append(`<option id="${categoryPairs[i][0]}">${categoryPairs[i][0]}</option>`);
                }
            }

            return savedCategories;
        },

        saveCells(cell, data, test) {
            let cells = JSON.parse(localStorage.getItem('Cells')) || [];
            cells.push({ Cell: cell, Data: data, TEST: test});

            localStorage.setItem('Cells', JSON.stringify(cells));
        },

        //Cells loaded on dropdown change - NOT COMPLETE - Bug fix needed
        loadCells() {
            const savedCells = JSON.parse(localStorage.getItem('Cells'));

            if (savedCells) {
                savedCells.forEach(function (cellObject) {
                    let cell = $("#" + cellObject.Cell)
                    $(cell).html(cellObject.Data);
                })
            }
        },

        removeCells(cell) {
            const savedCells = JSON.parse(localStorage.getItem('Cells')); //Remember, this is an array

            if (savedCells) {
                removeMe = savedCells.findIndex(indexToRemove);

                function indexToRemove(item) {
                    return item.Cell === cell;
                }

                savedCells.splice(removeMe, 1);
                localStorage.setItem('Cells', JSON.stringify(savedCells));

            }
        }
    }


    const calendar = {

        //grabs date from user input
        grabDate() {
            let selectedDate = $('#date').val();
            if (!selectedDate) {
                let currentDate = new Date().toDateString();
                selectedDate = currentDate
            }
            let date = new Date(selectedDate);
            let day = date.getDate();
            let month = date.getMonth() + 1;
            let year = date.getFullYear();

            return [month, year];
        },

        //creates new date object and returns number of days in parsed month
        daysInMonth(month, year) {
            return new Date(year, month, 0).getDate();
        },

        generateMonths() {
            const months = ["January", "February", "March", "April", "May", "June",
                "July", "August", "September", "October", "November", "December"];

            //clears any previous calendar - REMOVE LATER
            $('#calendarBody').empty();

            //row created for each month with corresponding ids/classes
            let id = 1;
            months.forEach(function (month) {
                const header = $('<th></th>').attr('id', id).attr('class', 'monthRow').text(month);
                const row = $('<tr></tr>');
                row.append(header);
                $('#calendarBody').append(row);
                id++;
            })

            calendar.generateDays();
        },

        //generates a cell for each day in the month based on year selected by user
        generateDays() {
            //grabs year from user input
            const [, userYear] = calendar.grabDate();

            //loops through all rows with selected class
            $('.monthRow').each(function () {
                //creates month indentifier from current row's id
                const $rowHeader = $(this);
                const rowID = parseInt($rowHeader.attr('id'));
                //finds closest previous row
                const $row = $rowHeader.closest('tr');
                //calculates days in month using row's id
                const days = calendar.daysInMonth(rowID, userYear);
                //adds cell for each day in given month and sets unique id
                for (let i = 1; i <= days; i++) {
                    $row.append(`<td id="${i}-${rowID}-${userYear}" class="dayCell"><span class="dayMarker">${i}</span></td>`)
                };
            })
        },

        //displays calendar table
        display() {
            $('#calendarBody').show();
            $('#categoryContainer').show();
        }
    }

    const cells = {

        //unfinished. Sets cell content of users selection.
        setContent() {
            $('.dayCell').off('click').on('click', (function () {
                let selectedCategory = categories.currentSelection(); //selected dropdown category
                let $identifier = $(this).attr('id'); //cell id to pass to storage method
                let storedContent;

                //if dropdown is default do nothing.
                if (!selectedCategory) {
                    return;
                }
                //dupe check here
                let $dupeCheck = $(this).find('.userData').filter(function () {
                    return $(this).text() === selectedCategory;
                });

                if ($dupeCheck.length === 0) {
                    $(this).append(`<span class="userData">${selectedCategory}</span>`);
                    storedContent = $(this).html(); //CHANGE THIS TO BE MORE EFFICIENT

                    storageControl.saveCells($identifier, storedContent, selectedCategory);
                } else {
                    $dupeCheck.remove();
                    storageControl.removeCells($identifier); //delete from localStorage
                }
            }))
        },

        scale() {
            $('.dayCell').hover(function () {
                if($(this).find('span.userData').length > 0){
                $(this).addClass('scaled');
                }
            },
                function () {
                    $(this).removeClass('scaled');
                })
        }
    }

    const categories = {

        createCategory() {
            let $newCategory = $('#category').val().trim();
            let $categoryColor = $('#userColor').val();

            //checks for duplicate entry before adding to dropdown and committing to storage
            if ($newCategory && !categories.duplicateEntry($newCategory)) {
                $('#dropdown').append(`<option id="${$newCategory}" value="${$newCategory}">${$newCategory}</option>`);
                //parses category to method for localStorage
                storageControl.saveCategories($newCategory, $categoryColor);
                $('#error').text('');
            } else {
                $('#error').text('Category already exists');
            }
            $('#category').val('');
            $('#userColor').val('#000000');
        },

        duplicateEntry(entry) {
            let duplicate = $(`#dropdown option[value="${entry}"]`).length > 0;
            return duplicate;
        },

        //returns selected dropdown category 
        currentSelection() {
            let currentSelection = $('#dropdown').find('option:selected').attr('id');

            if (currentSelection) {
                console.log(currentSelection);
                return currentSelection;
            }
        }
    }

    const listeners = {
        submitDateListener() {
            $('#submit').click(calendar.grabDate);
            $('#submit').click(calendar.generateMonths);
            $('#submit').click(calendar.display);
            $('#submit').click(storageControl.loadCells);
            $('#submit').click(cells.setContent);
            $('#submit').click(cells.scale);
        },

        categoriesListener() {
            $('#addCategory').click(categories.createCategory);
        },

        dropdownListener() {
            $('#dropdown').on('change', function () {
                categories.currentSelection();
            })
        },

        clearAllListener() {
            $('#clearAll').click(initialise.reset)
        }
    }

    initialise.pageElements();
    storageControl.loadCategories();
    categories.currentSelection();
    listeners.submitDateListener();
    listeners.categoriesListener();
    listeners.clearAllListener();
    listeners.dropdownListener();

});