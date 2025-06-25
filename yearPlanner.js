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
                $('.userData').remove();
                $('.fullTitle').remove();
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

        getSavedCategories() {
            return JSON.parse(localStorage.getItem('Categories')) || [];
        },

        loadCategories() {
            const savedCategories = storageControl.getSavedCategories();

            if (savedCategories) {
                const categoryPairs = savedCategories.map(function (obj) {
                    return [obj.Title, obj.Color];
                })

                for (let i = 0; i < categoryPairs.length; i++) {
                    //Loads user categories into dropdown
                    $('#dropdown').append(`<option id="${categoryPairs[i][0]}">${categoryPairs[i][0]}</option>`);
                }
            }
        },

        saveCells(cell, data, color) {
            //Grabs existing storage item or creates one with empty array
            let cells = JSON.parse(localStorage.getItem('Cells')) || [];

            //Try to find this cell in that array
            let existingCell = cells.find(function (item) {
                return item.Cell === cell;
            })

            //If so, check if category data exists in it already
            if (existingCell) {
                //Checks if category already exists in this cell
                const duplicate = existingCell.Values.some(function (value) {
                    return value.Data === data;
                });

                //If category doesn't exist, add it
                if (!duplicate) {
                    existingCell.Values.push({ Data: data, Color: color });
                }
                //If cell doesn't exist in storage create whole new object    
            } else {
                cells.push({
                    Cell: cell,
                    Values: [{ Data: data, Color: color }]
                });
            }
            //commits new storage item
            localStorage.setItem('Cells', JSON.stringify(cells));
        },

        loadCells() {
            const savedCells = JSON.parse(localStorage.getItem('Cells'));

            if (savedCells) {
                savedCells.forEach(function (cellObject) {
                    let $cell = $("#" + cellObject.Cell)

                    cellObject.Values.forEach(function (value) {

                        $cell.append(`<span class="userData">${value.Data}<br></span>`);
                        let $colorTitle = $cell.find('.userData').last();
                        $colorTitle.css('background-color', value.Color);
                    })
                })
            }
        },

        removeCells(cell, data) {
            const savedCells = JSON.parse(localStorage.getItem('Cells')); //Array
            //If no cells in storage, do nothing
            if (!savedCells) {
                return;
            };
            //Finds if a cell in storage matches that which is passed in
            const cellObject = savedCells.find(function (item) {
                return item.Cell === cell;
            });
            //If not, do nothing
            if (!cellObject) {
                return;
            };
            //Filters Values array in current cell, KEEPS those that DON'T match passed in value
            //Effectively removing the data that matches
            cellObject.Values = cellObject.Values.filter(function (value) {
                return value.Data !== data;
            });

            //If Values array is now empty
            if (cellObject.Values.length === 0) {
                //Finds index of now empty cell object
                let index = savedCells.findIndex(function (item) {
                    return item.Cell === cell;
                });
                //splices out empty cell object
                savedCells.splice(index, 1);
            }
            //commits updated storage item
            localStorage.setItem('Cells', JSON.stringify(savedCells));
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

            //Ensures only one calendar can be generated at a time
            $('#calendarBody').empty();

            //row created for each month with corresponding ids/classes
            let id = 1;
            months.forEach(function (month) {
                const $header = $('<th></th>').attr('id', id).attr('class', 'monthRow').text(month);
                const $row = $('<tr></tr>');
                $row.append($header);
                $('#calendarBody').append($row);
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

        setContent() {
            $('.dayCell').off('click').on('click', (function () {
                let selectedCategory = categories.currentSelection(); //Grabs object of selected title/colour 

                let identifier = $(this).attr('id'); //cell id to pass to storage method

                //if dropdown is default do nothing.
                if (!selectedCategory) { return; }
                //check for content duplication
                let $dupeCheck = $(this).find('.userData').filter(function () {
                    return $(this).text() === selectedCategory.title;
                });

                if ($dupeCheck.length === 0) {
                    $(this).prepend(`<span class="userData">${selectedCategory.title}<br></span>`);
                    let $bg = $(this).find('.userData').first();
                    $bg.css('background', selectedCategory.color);

                    storageControl.saveCells(identifier, selectedCategory.title, selectedCategory.color);
                } else {
                    $dupeCheck.remove();
                    storageControl.removeCells(identifier, selectedCategory.title); //delete from localStorage
                }
            }))
        },

        display() {
            $('.userData').each(function () {
                let selected = categories.currentSelection();

                if ($(this).text() == selected.title) {
                    $(this).show();
                } else {
                    $(this).hide();
                }
            })
        },

        // NOT IMPLEMENTED
        // scale() {
        //     $('.dayCell').hover(function () {
        //         if ($(this).find('span.userData').length > 0) {
        //             $(this).addClass('scaled');
        //         }
        //     },
        //         function () {
        //             $(this).removeClass('scaled');
        //         })
        // }
    }

    const categories = {

        createCategory() {
            let newCategory = $('#category').val().trim();
            let categoryColor = $('#userColor').val();

            //checks for duplicate entry before adding to dropdown and committing to storage
            if (newCategory && !categories.duplicateCatEntry(newCategory, categoryColor)) {
                $('#dropdown').append(`<option id="${newCategory}" value="${newCategory}">${newCategory}</option>`);
                //parses category to method for localStorage
                storageControl.saveCategories(newCategory, categoryColor);
                $('#error').text('');
            } else {
                $('#error').text('Duplicate entry, please try another');
            }
            $('#category').val('');
            $('#userColor').val('#000000');
        },

        duplicateCatEntry(title, color) {
            const savedCategories = storageControl.getSavedCategories();

            return savedCategories.some(function (cat) {
                return cat.Title === title || cat.Color === color;
            });
        },

        //returns selected dropdown category and corresponding color as OBJECT
        currentSelection() {
            const categoryList = storageControl.getSavedCategories();
            let selectedCategory = $('#dropdown').find('option:selected').attr('id');

            if (!selectedCategory) { return }

            const category = categoryList.find(function (cat) {
                return cat.Title === selectedCategory;
            });

            if (category) {
                return {
                    title: category.Title,
                    color: category.Color
                };
            }
        },

        colorIndicator() {
            let selection = categories.currentSelection();
            if (selection) {
                $('#colorIndicator').show().css('color', selection.color);
            } else {
                $('#colorIndicator').hide();
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
                categories.colorIndicator();
                categories.currentSelection();
                cells.display();
            })
        },

        clearAllListener() {
            $('#clearAll').click(initialise.reset)
        }
    }

    initialise.pageElements();
    categories.currentSelection();
    listeners.submitDateListener();
    listeners.categoriesListener();
    listeners.clearAllListener();
    listeners.dropdownListener();
    storageControl.loadCategories();

});