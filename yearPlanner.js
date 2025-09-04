//BUGS & ISSUES
//✅ Newly created categories are not clickable in list until page refresh
//✅ Current method of toggling means newly created entries can 'flip-flop'. Change class name instead.
//✅ Newly created category cells aren't able to toggle until after refresh
//✅ Submit button duplicates category list each time it is pressed
//✅ Data not clearing effectively on 'Clear All'
//Single dots hidden behind dayMarker
//Multiple dots deform cell size

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
      // console.log(this.data);
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

      // console.log(this.data);
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

      calendar.dayHeaders();

      let [, userMonth] = calendar.grabDate();
      for (let i = 0; i < months.length; i++) {
        const index = (userMonth - 1 + i) % months.length; //wrap around
        const $header = $("<th></th>")
          .attr("id", index + 1)
          .attr("class", "monthRow")
          .text(months[index]);
        const $row = $("<tr></tr>");
        $row.append($header);
        $("#calendarBody").append($row);
      }
      calendar.generateDays();
    },

    generateDays() {
      let [userDay, userMonth, userYear] = calendar.grabDate();

      $(".monthRow").each(function () {
        if ($(this).attr("id") > 0) {
          const $rowHeader = $(this);
          const rowID = parseInt($rowHeader.attr("id"));

          const $row = $rowHeader.closest("tr");

          const days = calendar.daysInMonth(rowID, userYear);

          for (let i = 1; i <= days; i++) {
            $row.append(
              `<td id="${userYear}-${rowID}-${i}" class="dayCell"><span class="dayMarker">${i}</span><span class="catCount"></span></td>`
            );
          }
          calendar.fitDays($row);
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
              `<span class="fullTitle">${selectedCategory.title}</span>`,
              `<span class="dot" style="color: ${selectedCategory.color}">&#8226;</span>`
            );
            let $bg = $(this).find(".fullTitle").first();
            $bg.css("background", selectedCategory.color);

            dataHandler.addCell(identifier, selectedCategory.title);
            categories.updateCategoryCounts(); //NEW
          } else {
            $dupeTitle.remove();
            $dupeDot.remove();

            dataHandler.removeCell(identifier, selectedCategory.title);
            categories.updateCategoryCounts(); //NEW
          }

          // cells.contentCounter($(this));
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
      const cellData = data.cells;

      for (let cellId in cellData) {
        if (cellData.hasOwnProperty(cellId)) {
          let $cell = $("#" + cellId);
          let entries = cellData[cellId];

          for (let i = 0; i < entries.length; i++) {
            let category = entries[i].category;
            let color = categories[category]
              ? categories[category].color
              : "#000";

            $cell.append(`<span class="fullTitle">${category}</span>`);
            let $title = $cell.find(".fullTitle").last();
            $title.css("background-color", color);
            $cell.append(`<span class="dot">&#8226;</span>`);
            let $dot = $cell.find(".dot").last();
            $dot.css("color", color);

            // cells.contentCounter($cell);
          }
        }
      }
    },

    makeAllVisible(category) {
      $(".fullTitle").each(function () {
        let $cellContents = $(this).html();
        let $icon = $(`#${category}Select`).nextAll("img").first();
        if (category === $cellContents) {
          let $dot = $(this).next();
          $dot.attr("class", "dot");
          $icon.attr({ src: "Icons/openEye.png", class: "visible" });
        }
      });
    },

    //Still working here
    contentCounter(cell) {
      let contentCount = cell.find(".fullTitle").length;
      if (contentCount > 1) {
        cell.find(".dot").hide();
        cell.find(".catCount").text(contentCount);
        cells.scale();
      } else {
        cell.find(".dot").show();
        cell.find(".catCount").remove();
      }
    },

    scale() {
      //   $(".dayCell")
      //     .on("mouseenter", function () {
      //       const selected = categories.currentSelection();
      //       if (!selected) {
      //         return;
      //       }
      //       const $this = $(this);
      //       const $title = $this.find(".fullTitle").filter(function () {
      //         return $(this).text() === selected.title;
      //       });
      //       const $dot = $this.find(".dot").filter(function () {
      //         return $(this).css("color") === cells.hexConvert(selected.color);
      //       });
      //       if ($title.length > 0 && $dot.length > 0) {
      //         $this.addClass("scaled");
      //         $title.show();
      //         $dot.hide();
      //       }
      //     })
      //     .on("mouseleave", function () {
      //       const $this = $(this);
      //       if ($this.hasClass("scaled")) {
      //         const $title = $this.find(".fullTitle");
      //         const $dot = $this.find(".dot");
      //         $this.removeClass("scaled");
      //         $title.hide();
      //         $dot.show();
      //       }
      //     });
    },
  };

  const categories = {
    createCategory() {
      let newCategory = $("#category").val().trim();
      let safeCatTitle = newCategory.replace(/\s+/g, ""); //NEW
      let categoryColor = $("#userColor").val();
      let listAppend = `<ul class="taskCategory"><input type="radio" name="categorySelector" id="${safeCatTitle}Select" value="${newCategory}"><img id="${safeCatTitle}Eyes" class="visible" src="Icons/openEye.png"><span class="catTitle">${newCategory}</span><span class="catColor" style=
          "color:${categoryColor}"> &#8226;</span><span class="${safeCatTitle}Count"> ${0} instance(s) </span>`;

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
          }"> &#8226;</span><span class="${safeCatTitle}Count"> ${0} instance(s) </span>`
        );
      });
      categories.categoryListInteract();
    },

    //NEW
    categoryListInteract() {
      let $eye = $(".taskCategory").find("img");

      $($eye).click(function () {
        let $listTitle = $(this).siblings(".catTitle").text();
        $(".fullTitle").each(function () {
          let $cellContents = $(this).html();

          if ($listTitle === $cellContents) {
            let $dot = $(this).next();
            if ($dot.attr("class") === "dot") {
              $dot.attr("class", "dotHidden");
            } else if ($dot.attr("class") === "dotHidden") {
              $dot.attr("class", "dot");
            }
          }
        });
      });

      $($eye).click(function () {
        if ($(this).attr("src") === "Icons/openEye.png") {
          $(this).attr({ src: "Icons/closedEye.png", class: "hidden" });
        } else if ($(this).attr("src") === "Icons/closedEye.png") {
          $(this).attr({ src: "Icons/openEye.png", class: "visible" });
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
        .click(calendar.grabDate)
        .click(calendar.generateMonths)
        .click(calendar.display)
        .click(cells.loadCells)
        .click(cells.setContent)
        .click(categories.updateCategoryUI)
        .click(categories.updateCategoryCounts);
      // .click(cells.scale)
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
  categories.categoryListInteract(); //NEW
});
