const dataManager = (function () {
  let instance;

  class DataHandler {
    constructor() {
      this.data = {
        categories: {},
        cells: {},
      };
      this.loadFromStorage();
    }

    getData() {
      return JSON.parse(JSON.stringify(this.data));
    }

    addCategory(title, color) {
      this.data.categories[title] = { color: color };
      this.saveToStorage();
    }

    getCategories() {
      return this.data.categories;
    }

    addCell(cellDate, title) {
      if (!this.data.cells[cellDate]) {
        this.data.cells[cellDate] = [];
      }

      let exists = false;
      for (let i = 0; i < this.data.cells[cellDate].length; i++) {
        if (this.data.cells[cellDate][i].category === title) {
          exists = true;
          break;
        }
      }

      if (!exists) {
        this.data.cells[cellDate].push({ category: title });
      } else {
        return;
      }
      console.log(this.data);
      this.saveToStorage();
    }

    removeCell(cellDate, title) {
      if (!this.data.cells[cellDate]) {
        return;
      }

      this.data.cells[cellDate] = this.data.cells[cellDate].filter(function (
        entry
      ) {
        return entry.category !== title;
      });

      if (this.data.cells[cellDate].length === 0) {
        delete this.data.cells[cellDate];
        console.log(`All entries for ${cellDate} removed.`);
      }

      console.log(this.data);
      this.saveToStorage();
    }

    getCells() {
      return this.data.cells;
    }

    saveToStorage() {
      localStorage.setItem("storedData", JSON.stringify(this.data));
    }

    loadFromStorage() {
      const storedData = localStorage.getItem("storedData");
      if (storedData) {
        this.data = JSON.parse(storedData);
      }
    }
  }

  return {
    getInstance: function () {
      if (!instance) {
        instance = new DataHandler();
      }
      return instance;
    },
  };
})();

$(document).ready(function () {
  const dataHandler = dataManager.getInstance();

  const initialise = {
    pageElements() {
      document.getElementById("date").valueAsDate = new Date();
    },

    reset() {
      if (confirm("Are you sure?")) {
        localStorage.clear();
        $("#category").val("");
        $("#dropdown option:not(:first)").remove();
        $(".fullTitle").remove();
        $(".dot").remove();
        $("#colorIndicator").hide();
      } else {
        return;
      }
    },
  };

  const calendar = {
    //grabs date from user input
    grabDate() {
      let selectedDate = $("#date").val();
      if (!selectedDate) {
        let currentDate = new Date().toDateString();
        selectedDate = currentDate;
      }
      let date = new Date(selectedDate);
      let month = date.getMonth() + 1;
      let year = date.getFullYear();

      return [month, year];
    },

    //creates new date object and returns number of days in parsed month
    daysInMonth(month, year) {
      return new Date(year, month, 0).getDate();
    },

    generateMonths() {
      const months = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
      ];

      //Ensures only one calendar can be generated at a time
      $("#calendarBody").empty();

      calendar.dayHeaders();

      //row created for each month with corresponding ids/classes
      let id = 1; //changed from 1 to account for days row
      months.forEach(function (month) {
        const $header = $("<th></th>")
          .attr("id", id)
          .attr("class", "monthRow")
          .text(month);
        const $row = $("<tr></tr>");
        $row.append($header);
        $("#calendarBody").append($row);
        id++;
      });

      calendar.generateDays();
    },

    //generates a cell for each day in the month based on year selected by user
    generateDays() {
      //grabs year from user input
      const [, userYear] = calendar.grabDate();

      //loops through all rows with selected class
      $(".monthRow").each(function () {
        //creates month indentifier from current row's id
        if ($(this).attr("id") > 0) {
          const $rowHeader = $(this);
          const rowID = parseInt($rowHeader.attr("id"));
          //finds closest previous row
          const $row = $rowHeader.closest("tr");
          //calculates days in month using row's id
          const days = calendar.daysInMonth(rowID, userYear);
          //adds cell for each day in given month and sets unique id
          for (let i = 1; i <= days; i++) {
            $row.append(
              `<td id="${userYear}-${rowID}-${i}" class="dayCell"><span class="dayMarker">${i}</span></td>`
            );
          }
          calendar.fitDays($row); //Runs once for each month
        }
      });
    },

    dayHeaders() {
      const days = ["M", "Tu", "W", "Th", "F", "Sa", "Su"];

      const $newHeader = $("<tr></tr>");
      $newHeader.append("<th style='visibility:hidden'></th>");
      //arbitrarily runs 5 times just to populate. Is not dynamic.
      for (let count = 0; count < 5; count++) {
        days.forEach(function (day) {
          $newHeader.append(`<th>${day}</th>`);
        });
      }
      $("#calendarBody").append($newHeader);
    },

    fitDays(month) {
      const $firstOfMonth = month.find("td:first").attr("id");
      const blank = month.find("th:first");
      const workingDate = new Date($firstOfMonth);
      let offset = workingDate.getDay();
      if (offset == 0) {
        offset = 7;
      }
      for (let i = 1; i < offset; i++) {
        blank.after(`<td style="visibility:hidden"></td>`);
      }
    },

    display() {
      $("#calendarBody").show();
      $("#categoryContainer").show();
    },
  };

  const cells = {
    setContent() {
      $(".dayCell")
        .off("click")
        .on("click", function () {
          let selectedCategory = categories.currentSelection();

          let identifier = $(this).attr("id");

          //if dropdown is default do nothing.
          if (!selectedCategory) {
            return;
          }
          //check for content duplication
          let $dupeTitle = $(this)
            .find(".fullTitle")
            .filter(function () {
              return $(this).text() === selectedCategory.title;
            });

          let $dupeDot = $(this)
            .find(".dot")
            .filter(function () {
              return (
                $(this).css("color") ===
                cells.hexConvert(selectedCategory.color)
              );
            });

          if ($dupeTitle.length === 0) {
            $(this).prepend(
              `<span class="fullTitle">${selectedCategory.title}<br></span>`,
              `<span class="dot" style="color: ${selectedCategory.color}">&#8226;</span>`
            );
            let $bg = $(this).find(".fullTitle").first();
            $bg.css("background", selectedCategory.color);

            dataHandler.addCell(identifier, selectedCategory.title); //CHANGED HERE
          } else {
            $dupeTitle.remove();
            $dupeDot.remove();

            dataHandler.removeCell(identifier, selectedCategory.title); //CHANGED HERE
          }
        });
    },

    hexConvert(hex) {
      hex = hex.replace("#", "");

      if (hex.length === 3) {
        hex = hex
          .split("")
          .map(function (char) {
            return char + char;
          })
          .join("");
      }

      const int = parseInt(hex, 16);
      const r = (int >> 16) & 255;
      const g = (int >> 8) & 255;
      const b = int & 255;

      return `rgb(${r}, ${g}, ${b})`;
    },

    loadCells() {
      const data = dataHandler.getData();
      const categories = data.categories;
      const cells = data.cells;

      for (let cellId in cells) {
        if (cells.hasOwnProperty(cellId)) {
          let $cell = $("#" + cellId);
          let entries = cells[cellId];

          for (let i = 0; i < entries.length; i++) {
            let category = entries[i].category;
            let color = categories[category]
              ? categories[category].color
              : "#000";

            $cell.append(`<span class="fullTitle">${category}<br></span>`);
            let $title = $cell.find(".fullTitle").last();
            $title.css("background-color", color);
            $cell.append(`<span class="dot">&#8226;</span>`);
            let $dot = $cell.find(".dot").last();
            $dot.css("color", color);
          }
        }
      }
    },

    displaySelected() {
      $(".fullTitle").each(function () {
        let selected = categories.currentSelection();
        let $dot = $(this).siblings(".dot");
        if (!selected) {
          return;
        }
        if ($(this).text() == selected.title) {
          $dot.show();
        } else {
          $dot.hide();
        }
      });
    },

    scale() {
      $(".dayCell")
        .on("mouseenter", function () {
          const selected = categories.currentSelection();
          if (!selected) {
            return;
          }
          const $this = $(this);

          // Check if this cell contains the selected category
          const $title = $this.find(".fullTitle").filter(function () {
            return $(this).text() === selected.title;
          });

          const $dot = $this.find(".dot").filter(function () {
            return $(this).css("color") === cells.hexConvert(selected.color);
          });

          if ($title.length > 0 && $dot.length > 0) {
            $this.addClass("scaled");
            $title.show();
            $dot.hide();
          }
        })
        .on("mouseleave", function () {
          const $this = $(this);
          if ($this.hasClass("scaled")) {
            const $title = $this.find(".fullTitle");
            const $dot = $this.find(".dot");
            $this.removeClass("scaled");
            $title.hide();
            $dot.show();
          }
        });
    },
  };

  const categories = {
    createCategory() {
      let newCategory = $("#category").val().trim();
      let categoryColor = $("#userColor").val();

      //checks for duplicate entry before adding to dropdown and committing to storage
      if (
        newCategory &&
        !categories.duplicateCatEntry(newCategory, categoryColor)
      ) {
        $("#dropdown").append(
          `<option id="${newCategory}" value="${newCategory}">${newCategory}</option>`
        );

        dataHandler.addCategory(newCategory, categoryColor); //CHANGED HERE
        $("#error").text("");
      } else {
        $("#error").text("Duplicate entry, please try another");
      }
      $("#category").val("");
      $("#userColor").val("#000000");
    },

    duplicateCatEntry(title, color) {
      const savedCategories = dataHandler.getCategories(); //CHANGED HERE

      for (let key in savedCategories) {
        if (key === title || savedCategories[key].color === color) {
          return true;
        }
      }

      return false;
    },

    updateDropdownUI() {
      // Call explicitly when dropdown data will have changed
      const categories = dataHandler.getCategories();
      $("#dropdown option:not(:first)").remove();
      Object.keys(categories).forEach(function (title) {
        $("#dropdown").append(
          `<option id="${title}" value="${title}">${title}</option>`
        );
      });
    },

    currentSelection() {
      const categoryList = dataHandler.getCategories(); //CHANGED HERE
      let selectedCategory = $("#dropdown").val();

      if (!selectedCategory || !categoryList[selectedCategory]) {
        return;
      }
      return {
        title: selectedCategory,
        color: categoryList[selectedCategory].color,
      };
    },

    colorIndicator() {
      let selection = categories.currentSelection();
      if (selection) {
        $("#colorIndicator").show().css("color", selection.color);
      } else {
        $("#colorIndicator").hide();
      }
    },
  };

  const listeners = {
    submitDateListener() {
      $("#submit")
        .click(calendar.grabDate)
        .click(calendar.generateMonths)
        .click(calendar.display)
        .click(cells.loadCells)
        .click(cells.setContent)
        .click(cells.scale);
    },

    categoriesListener() {
      $("#addCategory").click(categories.createCategory);
    },

    dropdownListener() {
      $("#dropdown").on("change", function () {
        categories.colorIndicator();
        // categories.currentSelection(); No longer needed on change
        cells.displaySelected();
      });
    },

    clearAllListener() {
      $("#clearAll").click(initialise.reset);
    },
  };

  initialise.pageElements();
  categories.updateDropdownUI();
  categories.currentSelection();
  listeners.submitDateListener();
  listeners.categoriesListener();
  listeners.clearAllListener();
  listeners.dropdownListener();
  // dataHandler.getCategories(); not needed?
});
