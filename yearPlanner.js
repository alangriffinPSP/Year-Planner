//BUGS & ISSUES
//✅ Delete does not yet remove category/cells from data object
//✅ Generate 13th month row
//✅ Generate 'overflow' day cells
//✅ Fresh page load doesn't populate date picker with today's date
//✅ Calendar loop - N.B. Year must increase on loop past Dec. (Can't find working condition)
//✅ Selection of invisible rows should force visibility
//✅ Visibility not working correctly on year change
//✅ Colorpicker can be closed before choosing color, next category created changes saved category color.
// Right side of assignment cannot be destructured" (Check live version) displaySelection()
// Refactor/remove grabDate()
// Refactor/remove multiple table row creations

const dataManager = (function () {
  let instance;

  class DataHandler {
    constructor() {
      this.data = {
        userDate: {},
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
        userDate: {},
        categories: {},
        cells: {},
      };
      localStorage.removeItem("storedData");
      this.saveToStorage();
    }

    saveDate(userDate) {
      this.data.userDate = userDate;
      this.saveToStorage();
    }

    getDate() {
      return this.data.userDate;
    }

    addCategory(title, color) {
      this.data.categories[title] = { color: color };
      this.saveToStorage();
    }

    editCategory(title, color) {
      this.data.categories[title].color = color;
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
    dateSetter() {
      let savedDate = dataHandler.getDate();
      const dates = new Object();

      if (!savedDate || Object.keys(savedDate).length === 0) {
        console.log(savedDate);
        let fullDate = new Date();

        dates.year = fullDate.getFullYear();
        dates.month = String(fullDate.getMonth() + 1).padStart(2, "0");
        dates.date = String(fullDate.getDate()).padStart(2, "0");
        dates.day = fullDate.getDay();

        dates.formattedDate = `${dates.year}-${dates.month}-${dates.date}`;

        savedDate = dates.formattedDate;
      } else {
        let fullDate = new Date(savedDate);

        let splitSavedDate = savedDate.split("-");
        dates.year = splitSavedDate[0];
        dates.month = splitSavedDate[1];
        dates.date = splitSavedDate[2];
        dates.day = fullDate.getDay();

        dates.formattedDate = `${dates.year}-${dates.month}-${dates.date}`;
      }
      $("#date").val(dates.formattedDate);

      return dates;
    },

    reset() {
      if (confirm("Are you sure?")) {
        $("#category").val("");
        $(".catTableRow").remove();
        $(".fullTitle").remove();
        $(".contentStripe").remove();
        $("#selectionContainer").hide();
        $("#userColor").val("#000000");
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
      let fullDate = new Date(selectedDate);
      let day = fullDate.getDay();
      let date = fullDate.getDate();
      let month = fullDate.getMonth() + 1;
      let year = fullDate.getFullYear();

      if (date < 10) {
        date = `0${date}`;
      }

      return [day, month, year, date];
    },

    recordDate() {
      userDate = $("#date").val();
      console.log(`Saving date: ${userDate}`);
      dataHandler.saveDate(userDate);
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

    generateMonths(changedYear) {
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
      if (typeof changedYear === "number") {
        userYear = changedYear;
      }
      let uniqueID;
      let firstMonthCheck;
      let lastMonthCheck;
      let totalMonths;

      let [, , , userDate] = calendar.grabDate();

      if (userDate > 1) {
        totalMonths = months.length + 1;
      } else {
        totalMonths = months.length;
      }

      for (let i = 0; i < totalMonths; i++) {
        const index = (userMonth - 1 + i) % months.length;
        const yearOffset = Math.floor((userMonth - 1 + i) / 12); //Increments year past Dec.
        const currentYear = userYear + yearOffset;

        //Creates unique ID for looped month row
        if (i < months.length) {
          uniqueID = index + 1;
        } else {
          uniqueID = index + 1 + "_2";
        }

        let $header = $("<th></th>")
          .attr("id", uniqueID)
          .attr("class", "monthLabel")
          .text(months[index]);
        let $row = $('<tr class="monthRow"></tr>');
        $row.append($header);
        $("#calendarBody").append($row);

        if (i === 0) {
          firstMonthCheck = true;
        } else if (i === 12) {
          lastMonthCheck = true;
        } else {
          firstMonthCheck = false;
        }

        calendar.generateDays(
          firstMonthCheck,
          $header,
          currentYear,
          lastMonthCheck
        );
      }
      calendar.dayHeaders();
    },

    generateDays(firstMonthCheck, monthRow, userYear, lastMonthCheck) {
      let [, , , userDate] = calendar.grabDate();
      let day = 1;

      if (firstMonthCheck === true) {
        if (userDate < 10) {
          userDate = userDate.split(`0`)[1];
        }
        day = userDate;
      }

      let currentMonth = monthRow.attr("id").split("_")[0];
      let totalDays = calendar.daysInMonth(currentMonth, userYear);
      let insertionPoint = monthRow.closest(".monthRow");

      if (lastMonthCheck === true) {
        totalDays = userDate - 1;
      }

      for (let i = day; i <= totalDays; i++) {
        let [paddedMonth, paddedDay] = calendar.safariFix(currentMonth, i);
        insertionPoint.append(
          `<td id="${userYear}-${paddedMonth}-${paddedDay}" class="dayCell"><span class="dayMarker">${i}</span><div class="contentContainer"></div></td>`
        );
      }
      calendar.fitDays(monthRow);
    },

    dayHeaders() {
      $("#dayHeaders").remove();
      const days = ["M", "Tu", "W", "Th", "F", "Sa", "Su"];

      const $newHeader = $('<tr id="dayHeaders"></tr>');
      $newHeader.append(
        "<th class='dayHeaderRow'><button id='prevYear'>-</button> Year <button id='nextYear'>+</button></th>"
      );

      let count = calendar.dayCounting();

      for (let i = 0; i < count; i++) {
        const dayLabel = days[i % days.length];
        $newHeader.append(`<th class="dayLabel">${dayLabel}</th>`);
      }
      $("#calendarBody").prepend($newHeader);
      calendar.changeYear();
    },

    fitDays(monthRow) {
      const $firstCell = monthRow.siblings("td:first").attr("id");
      const safeID = $firstCell.replace("_2", "");
      const workingDate = new Date(safeID);
      let offset = workingDate.getDay();
      if (offset == 0) {
        offset = 7;
      }
      for (let i = 1; i < offset; i++) {
        monthRow.after(`<td style="visibility:hidden"></td>`);
      }
    },

    changeYear() {
      let [, selectedMonth, selectedYear, selectedDate] = calendar.grabDate();
      let [safeMonth] = calendar.safariFix(selectedMonth);
      let newDate;

      $("#prevYear").click(function () {
        selectedYear -= 1;
        newDate = `${selectedYear}-${safeMonth}-${selectedDate}`;
        $("#date").val(newDate);
        calendar.generateMonths(selectedYear);
        calendar.dayHeaders();
        cells.loadCells();
        cells.setContent();
        categories.updateCategoryCountUI();
        cells.toggleVisibility();
      });
      $("#nextYear").click(function () {
        selectedYear += 1;
        newDate = `${selectedYear}-${safeMonth}-${selectedDate}`;
        $("#date").val(newDate);
        calendar.generateMonths(selectedYear);
        calendar.dayHeaders();
        cells.loadCells();
        cells.setContent();
        categories.updateCategoryCountUI();
        cells.toggleVisibility();
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

          let visibility = $(`#${selectedCategory.title}Check`).prop("checked");

          if (visibility === false) {
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
            categories.updateCategoryCountUI();
          } else {
            if (visibility === true) {
              $dupeTitle.remove();
              $dupeContent.remove();
              dataHandler.removeCell(identifier, selectedCategory.title);
            }

            categories.updateCategoryCountUI();
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
      cells.setVisibility();
    },

    toggleVisibility() {
      $(".visiToggle").change(function () {
        let title = $(this).closest("tr").find(".titleCell").text();
        let $stripe = $(`#${title}.contentStripe`);
        let boxState = $(this).is(":checked");

        if (boxState === false) {
          $stripe.css("display", "none");
        } else {
          $stripe.css("display", "flex");
        }
      });
    },

    setVisibility() {
      $(".contentStripe").each(function () {
        let stripe = $(this);
        let cellContents = stripe.attr("id");
        let $relatedCheckBox = $(`#${cellContents}Check`);

        if ($relatedCheckBox.is(":checked")) {
          stripe.css("display", "flex");
        } else {
          stripe.css("display", "none");
        }
      });
    },

    makeAllVisible(category) {
      $(".contentStripe").each(function () {
        let cellContents = $(this).attr("id");
        let $checkBox = $(`#${category}Check`);
        if (category === cellContents) {
          $(this).css("display", "flex");
          $checkBox.prop("checked", true);
        }
      });
    },
  };

  const categories = {
    //Condense
    createCategory() {
      let newCategory = $("#category").val().trim();
      let safeCatTitle = `${newCategory.replace(/\s+/g, "")}`;
      let catColor = $("#userColor").val();

      let checkbox = `<td class="checkCell"><input class="visiToggle" id="${safeCatTitle}Check" type="checkbox" checked></td>`;
      let colorBox = `<td class="colorCell"><input type="color" class="colorEditPicker" id="${safeCatTitle}EditColor"/></td>`;
      let titleBox = `<td class="titleCell"><span class="titleBox" id="${safeCatTitle}Title">${safeCatTitle}</span>`;
      let curCount = `<td class="countCell"><span class="count" id="${safeCatTitle}Count">${categories.categoryCountPerYear(
        safeCatTitle
      )}</span><span class="countLabel">/yr</span></td>`;
      let totCount = `<td class="totCell"><span class="count" id="${safeCatTitle}Total">${categories.categoryCountPerYear(
        safeCatTitle
      )}</span><span class="countLabel">/tot</span></td>`;
      let deleteIcon = `<td class="delCell"><img class="delIcon" id="${safeCatTitle}Del" src="Icons/bin.png"></img></td>`;

      let tableAppend = `<tr class="catTableRow" id="${safeCatTitle}Row">${checkbox}${colorBox}${titleBox}${curCount}${totCount}${deleteIcon}</tr>`;

      $(`#${safeCatTitle}EditColor`).val(catColor);

      if (newCategory && !categories.duplicateCatEntry(newCategory, catColor)) {
        $("#categoryTable").append(tableAppend);

        dataHandler.addCategory(newCategory, catColor);
        categories.updateCategoryCountUI();
        categories.updateCategoryUI();
        categories.categoryTableInteract();
        cells.toggleVisibility();

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

    categoryCountPerYear(title) {
      let count = 0;
      $(".fullTitle").each(function () {
        const text = $(this).text().trim();
        if (text === title) {
          count++;
        }
      });
      return count;
    },

    categoryCountTotal(title) {
      let total = 0;
      const cells = dataHandler.getCells();
      Object.keys(cells).forEach(function (cell) {
        cells[cell].forEach(function (item) {
          const key = Object.keys(item)[0];
          const value = item[key];
          if (value === title) {
            total++;
          }
        });
      });
      return total;
    },

    updateCategoryCountUI() {
      const savedCategories = dataHandler.getCategories();
      Object.keys(savedCategories).forEach(function (title) {
        const count = categories.categoryCountPerYear(title);
        const total = categories.categoryCountTotal(title);
        let safeCatTitle = title.replace(/\s+/g, "");
        $(`#${safeCatTitle}Count`).text(count);
        $(`#${safeCatTitle}Total`).text(total);
      });
    },

    //Condense
    updateCategoryUI() {
      $("#categoryTable").empty();
      const savedCategories = dataHandler.getCategories();

      Object.keys(savedCategories).forEach(function (title) {
        let catColor = savedCategories[title].color;
        let safeCatTitle = title.replace(/\s+/g, "");
        let checkbox = `<td class="checkCell"><input class="visiToggle" id="${safeCatTitle}Check" type="checkbox" checked></td>`;
        let colorBox = `<td class="colorCell"><input type="color" class="colorEditPicker" id="${safeCatTitle}EditColor"/></td>`;
        let titleBox = `<td class="titleCell"><span class="titleBox" id="${safeCatTitle}Title">${safeCatTitle}</span>`;
        let curCount = `<td class="countCell"><span class="count" id="${safeCatTitle}Count">${categories.categoryCountPerYear(
          safeCatTitle
        )}</span><span class="countLabel">/yr</span></td>`;
        let totCount = `<td class="totCell"><span class="count" id="${safeCatTitle}Total">${categories.categoryCountTotal(
          safeCatTitle
        )}</span><span class="countLabel">/tot</span></td>`;
        let deleteIcon = `<td class="delCell"><img class="delIcon" id="${safeCatTitle}Del" src="Icons/bin.png"></img></td>`;

        let tableAppend = `<tr class="catTableRow" id="${safeCatTitle}Row">${checkbox}${colorBox}${titleBox}${curCount}${totCount}${deleteIcon}</tr>`;
        $("#categoryTable").append(tableAppend);

        $(`#${safeCatTitle}EditColor`).val(catColor);
      });
      categories.categoryTableInteract();
      cells.toggleVisibility();
    },

    categoryTableInteract() {
      //Category selection handling
      $(".catTableRow")
        .off("click")
        .on("click", function () {
          $(".catTableRow").removeClass("tableRowSelected");
          $(this).addClass("tableRowSelected");
          categories.displaySelection();
        });

      //Record deletion handling
      let $bin = $(".delIcon");
      $($bin)
        .off("click")
        .on("click", function () {
          let $tableRow = $(this).closest(".catTableRow");
          let $currentTitle = $(this)
            .closest(".delCell")
            .siblings(".titleCell")
            .text();
          if (confirm(`Would you like to delete ${$currentTitle}?`)) {
            $tableRow.remove();
            $("#selectionContainer").hide();
            dataHandler.removeRecord($currentTitle);
            cells.loadCells();
          }
        });

      //Colour change handling
      const categoryList = dataHandler.getCategories();
      $(".colorEditPicker").on("click", function () {
        const currentColor = $(this).val();
        const currentTitle = $(this)
          .closest(".colorCell")
          .siblings(".titleCell")
          .text();
        let newColor;
        $(this)
          .off("change")
          .on("change", function () {
            newColor = $(this).val();
            if (
              categories.colorDuplicateCheck(
                categoryList,
                currentTitle,
                newColor
              ) === true
            ) {
              alert("Record exists with this colour. Please pick another.");
              $(this).val(currentColor);
              return;
            }

            if (currentTitle in categoryList) {
              const currentRecord = categoryList[currentTitle];
              currentRecord.color = newColor;
              dataHandler.editCategory(currentTitle, newColor);
              const selectedTitle = $(".tableRowSelected")
                .find(".titleCell")
                .text(); //Records selected row
              categories.updateCategoryUI();
              if (selectedTitle) {
                $(`#${selectedTitle}Row`).addClass("tableRowSelected"); //Reinstates selected row
              }
              categories.displaySelection();
              cells.loadCells();
            }
          });
      });
    },

    colorDuplicateCheck(categoryList, excludeTitle, checkingColor) {
      for (const title in categoryList) {
        if (title === excludeTitle) continue;
        if (categoryList[title].color === checkingColor) {
          return true;
        }
      }
      return false;
    },

    //Error thrown here? - Investigate
    displaySelection() {
      let { title: selectedCategory, color: selectedColor } =
        categories.currentSelection();
      $("#selectionContainer").css("display", "flex");
      $("#currentColor").css("background-color", selectedColor);
      $("#currentTitle").text(selectedCategory);
    },

    currentSelection() {
      const categoryList = dataHandler.getCategories();

      let selectedCategory = $(".tableRowSelected").find(".titleCell").text();

      //Issue here?
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
        .click(calendar.recordDate)
        .click(calendar.generateMonths)
        .click(calendar.display)
        .click(calendar.changeYear)
        .click(categories.updateCategoryUI)
        .click(categories.updateCategoryCountUI)
        .click(cells.loadCells)
        .click(cells.setContent);
    },

    categoriesListener() {
      $("#addCategory").click(categories.createCategory);
    },

    clearAllListener() {
      $("#clearAll").click(initialise.reset);
    },
  };

  initialise.dateSetter();
  listeners.submitDateListener();
  listeners.categoriesListener();
  listeners.clearAllListener();
});
