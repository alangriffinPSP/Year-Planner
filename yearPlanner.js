//BUGS & ISSUES
//✅ Dots visibility incorrect after scaling - REQUIRES TESTING
//✅ Delete does not yet remove category/cells from data object - UNDERSTAND
//✅ Calendar loop - N.B. Year must increase on loop past Dec.
// Limit number of categories in list before starting new list

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

    clearData() {
      this.data = {
        categories: {},
        cells: {},
      };
      localStorage.removeItem("storedData");
      this.saveToStorage();
    }

    addCategory(title, color) {
      this.data.categories[title] = { color: color };
      this.saveToStorage();
    }

    removeRecord(title) {
      let targetCategory = title;
      for (let date in this.data.cells) {
        this.data.cells[date] = this.data.cells[date].filter(function (entry) {
          return entry.category !== targetCategory;
        });
        if (this.data.cells[date].length === 0) {
          delete this.data.cells[date];
        }
      }
      delete this.data.categories[title];

      console.log("Deleted record for: ", title);
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
        $("#category").val("");
        $("#categoryList").empty();
        $(".taskCategory").remove();
        $(".fullTitle").remove();
        $(".dot").remove();
        dataHandler.clearData();
      } else {
        return;
      }
    },
  };

  const calendar = {
    grabDate() {
      let selectedDate = $("#date").val();
      if (!selectedDate) {
        let currentDate = new Date().toDateString();
        selectedDate = currentDate;
      }
      let date = new Date(selectedDate);
      let day = date.getDay();
      let month = date.getMonth() + 1;
      let year = date.getFullYear();

      return [day, month, year];
    },

    daysInMonth(month, year) {
      return new Date(year, month, 0).getDate();
    },

    safariFix(month, day) {
      if (month < 10) {
        month = `0${month}`;
      }

      if (day < 10) {
        day = `0${day}`;
      }

      return [month, day];
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

      $("#calendarBody").empty();

      let [, userMonth, userYear] = calendar.grabDate();

      for (let i = 0; i < months.length; i++) {
        const index = (userMonth - 1 + i) % months.length;
        const $header = $("<th></th>")
          .attr("id", index + 1)
          .attr("class", "monthLabel")
          .text(months[index]);
        const $row = $('<tr class="monthRow"></tr>');
        $row.append($header);
        $("#calendarBody").append($row);
      }
      calendar.generateDays(userYear);
      calendar.dayHeaders();
    },

    //For each month row that has already been generated
    //append a cell(<TD>) for the number of days in that month
    //
    generateDays(userYear) {
      $("td").remove();
      // Strips user date to single digit to be used for cell start point
      let userDate = $("#date").val().split("-")[2];
      if (userDate < 10) {
        userDate = userDate.split("0")[1];
      }
      ////////////////////////////////////////////////

      // Checks Feb day count of current year to determine total number of cells needed
      const daysFeb = calendar.daysInMonth(2, userYear);
      let totalDayCount;

      if (daysFeb === 29) {
        totalDayCount = 366;
      } else {
        totalDayCount = 365;
      }
      ////////////////////////////////////////////////

      $(".monthLabel").each(function () {
        if ($(this).attr("id") > 0) {
          const $rowHeader = $(this);
          const rowID = parseInt($rowHeader.attr("id"));
          const $row = $rowHeader.closest("tr");
          const numberOfDays = calendar.daysInMonth(rowID, userYear);

          for (let i = 1; i <= numberOfDays; i++) {
            let [paddedMonth, paddedDay] = calendar.safariFix(rowID, i);

            $row.append(
              `<td id="${userYear}-${paddedMonth}-${paddedDay}" class="dayCell"><span class="dayMarker">${i}</span><div class="contentContainer"></div></td>`
            );

            let lastCellDate = `${userYear}-${paddedMonth}-${paddedDay}`;
            //Increments year if loop
            if (lastCellDate == `${userYear}-12-31`) {
              userYear += 1;
            }
          }
          calendar.fitDays($row);
        }
      });
    },

    dayHeaders() {
      $("#dayHeaders").remove();
      const days = ["M", "Tu", "W", "Th", "F", "Sa", "Su"];

      const $newHeader = $('<tr id="dayHeaders"></tr>');
      $newHeader.append(
        "<th class='dayHeaderRow'><button id='prevYear'>-</button> Year <button id='nextYear'>+</button></th>"
      );

      let count = calendar.dayCounting();

      //Solidify understanding
      for (let i = 0; i < count; i++) {
        const dayLabel = days[i % days.length];
        $newHeader.append(`<th>${dayLabel}</th>`);
      }
      $("#calendarBody").prepend($newHeader);
      calendar.changeYear();
    },

    fitDays(monthRow) {
      const $firstCell = monthRow.find("td:first").attr("id");
      const blank = monthRow.find("th:first");
      const workingDate = new Date($firstCell);
      let offset = workingDate.getDay();
      if (offset == 0) {
        offset = 7;
      }
      for (let i = 1; i < offset; i++) {
        blank.after(`<td style="visibility:hidden"></td>`);
      }
    },

    changeYear() {
      let selectedDate = $("#date").val().split("-")[2];
      let [, selectedMonth, selectedYear] = calendar.grabDate();
      let [safeMonth] = calendar.safariFix(selectedMonth);
      let newDate;

      $("#prevYear").click(function () {
        selectedYear -= 1;
        newDate = `${selectedYear}-${safeMonth}-${selectedDate}`;
        $("#date").val(newDate);
        calendar.generateDays(selectedYear);
        calendar.dayHeaders();
        cells.loadCells();
        cells.setContent();
        categories.updateCategoryCounts();
      });
      $("#nextYear").click(function () {
        selectedYear += 1;
        newDate = `${selectedYear}-${safeMonth}-${selectedDate}`;
        $("#date").val(newDate);
        calendar.generateDays(selectedYear);
        calendar.dayHeaders();
        cells.loadCells();
        cells.setContent();
        categories.updateCategoryCounts();
      });
    },

    dayCounting() {
      let longestRow = 0;

      $(".monthRow").each(function () {
        const currentRow = $(this).find(`td`).length;
        if (currentRow > longestRow) {
          longestRow = currentRow;
        }
      });

      return longestRow;
    },

    display() {
      $("#calendarBody").show();
      $("#categoryContainer").show();
      $("#categoryList").show();
    },
  };

  const cells = {
    setContent() {
      $(".dayCell")
        .off("click")
        .on("click", function () {
          let selectedCategory = categories.currentSelection();
          let identifier = $(this).attr("id");
          let $container = $(this).find(".contentContainer");

          if (!selectedCategory) {
            return;
          }

          let visibility = $(`img[id^='${selectedCategory.title}']`).attr(
            "class"
          );

          if (visibility === "hidden") {
            cells.makeAllVisible(selectedCategory.title);
          }

          let $dupeTitle = $(this)
            .find(".fullTitle")
            .filter(function () {
              return $(this).text() === selectedCategory.title;
            });

          let $dupeContent = $(this)
            .find(".contentStripe")
            .filter(function () {
              return $(this).attr("id") === selectedCategory.title;
            });

          if ($dupeTitle.length === 0) {
            $(this).prepend(
              `<span class="fullTitle">${selectedCategory.title}</span>`
            );
            $container.prepend(
              `<div class="contentStripe" id="${selectedCategory.title}">`
            );
            let $content = $($container).find(".contentStripe").first();
            $content.css("background-color", selectedCategory.color);

            dataHandler.addCell(identifier, selectedCategory.title);
            categories.updateCategoryCounts(); //NEW
          } else {
            $dupeTitle.remove();
            $dupeContent.remove();

            dataHandler.removeCell(identifier, selectedCategory.title);
            categories.updateCategoryCounts(); //NEW
          }
        });
    },

    loadCells() {
      $(".contentStripe").remove();
      $(".fullTitle").remove();
      const data = dataHandler.getData();
      const categories = data.categories;
      const cellData = data.cells;

      for (let cellId in cellData) {
        if (cellData.hasOwnProperty(cellId)) {
          let $cell = $("#" + cellId);
          let entries = cellData[cellId];
          let $contentContainer = $cell.find(".contentContainer");

          for (let i = 0; i < entries.length; i++) {
            let category = entries[i].category;
            let color = categories[category]
              ? categories[category].color
              : "#000";

            $cell.append(`<span class="fullTitle">${category}</span>`);
            let $title = $cell.find(".fullTitle").last();
            $title.css("background-color", color);
            $contentContainer.append(
              `<span class="contentStripe" id="${$title.html()}"></span>`
            );
            let $stripe = $cell.find(".contentStripe").last();
            $stripe.css("background-color", color);
          }
        }
      }
    },

    makeAllVisible(category) {
      $(".contentStripe").each(function () {
        let $cellContents = $(this).attr("id");
        let $icon = $(`#${category}Select`).nextAll("img").first();
        if (category === $cellContents) {
          $(this).css("display", "flex");
          $icon.attr({ src: "Icons/openEye.png", class: "visible" });
        }
      });
    },
  };

  const categories = {
    createCategory() {
      let newCategory = $("#category").val().trim();
      let safeCatTitle = newCategory.replace(/\s+/g, ""); //NEW
      let categoryColor = $("#userColor").val();
      let listAppend = `<ul class="taskCategory"><input type="radio" name="categorySelector" id="${safeCatTitle}Select" value="${newCategory}"><img id="${safeCatTitle}Eyes" class="visible" src="Icons/openEye.png"><span class="catTitle">${newCategory}</span><span class="catColor" style=
          "color:${categoryColor}"> &#8226;</span><span class="${safeCatTitle}Count"> ${0} instance(s) </span><img id="${safeCatTitle}Del" class="delIcon" src="Icons/bin.png">`;

      if (
        newCategory &&
        !categories.duplicateCatEntry(newCategory, categoryColor)
      ) {
        $("#categoryList").append(listAppend);

        dataHandler.addCategory(newCategory, categoryColor);
        categories.updateCategoryCounts();
        categories.updateCategoryUI();

        $("#error").text("");
      } else {
        $("#error").text("Duplicate entry, please try another");
      }
      $("#category").val("");
      $("#userColor").val("#000000");
    },

    duplicateCatEntry(title, color) {
      const savedCategories = dataHandler.getCategories();

      for (let key in savedCategories) {
        if (key === title || savedCategories[key].color === color) {
          return true;
        }
      }

      return false;
    },

    //NEW
    categoryCount(title) {
      let count = 0;
      $(".fullTitle").each(function () {
        const text = $(this).text().trim();
        if (text === title) {
          count++;
        }
      });
      return count;
    },

    updateCategoryCounts() {
      const savedCategories = dataHandler.getCategories();
      Object.keys(savedCategories).forEach(function (title) {
        const count = categories.categoryCount(title);
        let safeCatTitle = title.replace(/\s+/g, "");
        $(`.${safeCatTitle}Count`).text(` ${count} instance(s)`);
      });
    },

    updateCategoryUI() {
      $("#categoryList").empty();
      const savedCategories = dataHandler.getCategories();

      Object.keys(savedCategories).forEach(function (title) {
        let safeCatTitle = title.replace(/\s+/g, "");
        $("#categoryList").append(
          `<ul class="taskCategory"><input type="radio" name="categorySelector" id="${safeCatTitle}Select" value="${title}"><img id="${safeCatTitle}Eyes" class="visible" src="Icons/openEye.png"><span class="catTitle">${title}</span><span class="catColor" style=
          "color:${
            savedCategories[title].color
          }"> &#8226;</span><span class="${safeCatTitle}Count"> ${0} instance(s) </span><img id="${safeCatTitle}Del" class="delIcon" src="Icons/bin.png">`
        );
      });
      categories.categoryListInteract();
    },

    //NEW
    categoryListInteract() {
      let $eye = $(".taskCategory").find("img");
      let $bin = $(".taskCategory").find(".delIcon");

      $($eye).click(function () {
        if ($(this).attr("src") === "Icons/openEye.png") {
          $(this).attr({ src: "Icons/closedEye.png", class: "hidden" });
        } else if ($(this).attr("src") === "Icons/closedEye.png") {
          $(this).attr({ src: "Icons/openEye.png", class: "visible" });
        }

        let $listTitle = $(this).siblings(".catTitle").text();
        $(".contentStripe").each(function () {
          let $cellContents = $(this).attr("id");

          if ($listTitle === $cellContents) {
            let $stripe = $(this);
            if ($stripe.css("display") === "flex") {
              $stripe.css("display", "none");
            } else if ($stripe.css("display") === "none") {
              $stripe.css("display", "flex");
            }
          }
        });
      });

      $($bin).click(function () {
        let $currentCat = $(this).parent();
        let $currentTitle = $(this).prevAll(".catTitle").text();
        if (confirm(`Would you like to delete ${$currentTitle}?`)) {
          $currentCat.remove();
          dataHandler.removeRecord($currentTitle);
          cells.loadCells(); //Re-load cells after record deletion
        }
      });
    },

    currentSelection() {
      const categoryList = dataHandler.getCategories();
      let selectedCategory = $("input[name='categorySelector']:checked").val();

      if (!selectedCategory || !categoryList[selectedCategory]) {
        return;
      }
      return {
        title: selectedCategory,
        color: categoryList[selectedCategory].color,
      };
    },
  };

  const listeners = {
    submitDateListener() {
      $("#submit")
        .click(calendar.generateMonths)
        .click(calendar.display) // Shows calendar container
        .click(calendar.changeYear) //Wakes up year buttons
        .click(cells.loadCells)
        .click(cells.setContent)
        .click(categories.updateCategoryUI)
        .click(categories.updateCategoryCounts);
    },

    categoriesListener() {
      $("#addCategory").click(categories.createCategory);
    },

    radioButtonListener() {
      $(document).on("change", 'input[type="radio"]', function () {
        let $category = $(this).val();
        cells.makeAllVisible($category);
      });
    },

    clearAllListener() {
      $("#clearAll").click(initialise.reset);
    },
  };

  initialise.pageElements();
  categories.currentSelection();
  listeners.submitDateListener();
  listeners.categoriesListener();
  listeners.clearAllListener();
  listeners.radioButtonListener();
  categories.categoryListInteract();
});
