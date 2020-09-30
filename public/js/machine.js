$(function() {
  COORDINATE_FIELD = "svd";
  BOOK_DISPLAY_NUMBER = 10;
  MAX_ERROR = 2.0;
  ANGLE_STEP = 4;
  MAX_BUTTON_NUMBER = 3;
  MAX_KEYWORDS_PER_BOOK = 30;
  MAX_KEYWORDS_PER_CLUSTER = 5;
  INITIATED = false;
  MAX_ITERATION_NUMBER = 100;
  MIN_STEP = 0.2;
  TUTORIAL_MODE = false;
  names = [];
  addedControlArray = [];
  appHistory = [];
  currentCoordinates = [];
  cart = [];
  currentBook = "";
  saveHistory = function() {
    if (appHistory.length >= 1) {
      $("#undoButton").prop('disabled', false);
    }
    appHistory.push({
      "currentCoordinates": Array.from(currentCoordinates),
      "currentBook": currentBook,
      "controls": Array.from(addedControlArray)
    });
  };
  goToPast = function() {
    appHistory.pop();
    past = appHistory[appHistory.length - 1];
    return past;
  };
  updateUndoButton = function() {
    if (appHistory.length == 1) {
      $("#undoButton").prop('disabled', true);
      return;
    }
  }
  undo = function() {
    stateObj = goToPast();
    currentCoordinates = stateObj["currentCoordinates"];
    currentBook = stateObj["currentBook"];
    bookCoordinates = [...data[currentBook][COORDINATE_FIELD]];
    $("#tags").val(currentBook);
    sendBookUpdateMsg("undo", currentBook);
    updateNeighbours();
    addedControlArray = Array.from(stateObj["controls"]);
    sortClusters(bookCoordinates);
    restoreControls();
    updateClusterButtons();
    updateUndoButton();
  };
  $("#undoButton").click(undo);
  areNearestBooksTheSame = function(coord1, coord2) {
    list1 = getNeighbourArray(coord1);
    list2 = getNeighbourArray(coord2);
    for (jj = 0; jj < list2.length; jj++) {
      name1 = list1[jj]["obj"]["books"][0]["name"]
      name2 = list2[jj]["obj"]["books"][0]["name"]
      if (name1 != name2) {
        //console.log(name1)
        //console.log(name2)
        return false;
      }
    }
    return true;
  };
  areCoordinatesTheSame = function(coord1, coord2) {
    for (i = 0; i < coord1.length; i++) {
      if (coord1[i] != coord2[i]) {
        return false;
      }
    }
    return true;
  };
  updateClusterButtons = function() {
    $.each(clusters, function(key, value) {
      button = $("#moreButton" + key);
      if (areCoordinatesTheSame(currentCoordinates, value["centroid"])) {
        button.prop('disabled', true);
      } else {
        button.prop('disabled', false);
      }
    });
  };
  //last
  setBookName = function() {
    input = $("#tags").val();
    if (!(input in data)) {
      sendError(input);
      $("#errorField").text(localization["error"][LANG]);
      return;
    } else {
      $("#errorField").text("");
    }
    currentBook = input;
    if (!INITIATED) {
      //console.log("displayed");
      $("#mainTable").css("display", "initial");
      INITIATED = true;
    }
    currentCoordinates = [...data[input][COORDINATE_FIELD]];
    //currentCoordinates = normalizeVector(currentCoordinates);
    updateNeighbours();


    createControls();
    updateClusterButtons();
    saveHistory();
    updateCartTable();
  }
  /*$.each(data, function(key, value) {
    names.push(key);
  });*/
  $("#tags").autocomplete({
    source: names,
    minLength: 3
  });
  $("#pickButton").click(setBookName);
  $("#finishInput").autocomplete({
    source: names,
    minLength: 3
  });
  getTextByBooks = function(books) {
    var text = "";
    $.each(books, function(key, value) {
      text += getPrettyName(value, true) + "<br>";
    });
    return text;
  };
  areListsEqual = function(list1, list2) {
    var set1 = new Set();
    for (i = 0; i < list1.length; i++) {
      set1.add(list1[i]["obj"]["books"][0]["name"])
    }
    for (i = 0; i < list2.length; i++) {
      if (!set1.has(list2[i]["obj"]["books"][0]["name"])) {
        return false;
      }
    }
    return true;
  };
  getDistance = function(coord1, coord2) {
    dist = 0;
    for (i = 0; i < coord1.length; i++) {
      dist += (coord1[i] - coord2[i]) * (coord1[i] - coord2[i])
    }
    dist = Math.sqrt(dist);
    return dist;
  };
  getNeighbourArray = function(vector) {
    distArray = [];
    $.each(data, function(key, value) {
      if (key == currentBook) {
        return true;
      }
      distance = getCosine(vector, value[COORDINATE_FIELD]);
      distArray.push({
        dist: distance,
        obj: value
      });
    });
    distArray.sort(function(a, b) {
      return b["dist"] - a["dist"];
    });
    return distArray.slice(0, BOOK_DISPLAY_NUMBER)
  };
  getPrettyName = function(bookName, small) {
    titleStyle = "title";
    authorStyle = "author";
    if (small) {
      titleStyle += "Small";
      authorStyle += "Small";
    }
    out = "<span class='" + titleStyle + "'>";
    sepIndex = bookName.indexOf('/');
    if (sepIndex == -1) {
      return out + bookName + "</span>";
    }
    bookTitle = bookName.substring(0, sepIndex);
    bookAuthor = bookName.substring(sepIndex);
    out += bookTitle
    out += "</span><span class='" + authorStyle + "'>";
    out += bookAuthor;
    out += "</span>"
    return out;
  };
  updateDoneButton = function() {
    if (cart.length == 0) {
      $("#doneButton").prop('disabled', true);
    } else {
      $("#doneButton").prop("disabled", false);
    }
  };
  var updateNeighbours = function() {
    distArray = getNeighbourArray(currentCoordinates);
    $("#bookTable").empty();
    tooltipText = localization["relatedTooltip"][LANG];
    $("#bookTable").append("<tr><th>" + localization["relatedBooks"][LANG] + " <img src=\"public/img/help.png\" height=\"15px\" title='" + tooltipText + "'> </th><th></th></tr>");
    $("#bookTable").tooltip({
      open: function(event, ui) {
        sendOverBook("related", event);
      },
      close: function(event, ui) {
        sendOutBook("related", event);
      }
    });
    for (var i = 0; i < BOOK_DISPLAY_NUMBER; i++) {
      value = distArray[i];
      name = value["obj"]["books"][0]["name"]
      var tr = $("<tr></tr>");
      keyWordStr = getDescriptionByKeywords(keywordDict[name], MAX_KEYWORDS_PER_BOOK);
      keyWordStr = localization["bookTooltip"][LANG] + keyWordStr;
      var button = $("<button name='" + name + "' class='related'>" + localization["relatedButton"][LANG] + "</button>");
      var cartCheckbox = $("<input title='<span class=\"author\">" + localization["favoritesButtonTooltip"][LANG] + "' type=\"checkbox\" name=\"" + name + "\">");
      if (cart.indexOf(name) != -1) {
        cartCheckbox.prop('checked', true);
      }
      var tdCart = $("<td width='60px' align='right'></td>");
      tdCart.append(cartCheckbox);
      var tdButton = $("<td width='60px' align='right'></td>")
      tdButton.append(button)
      var tdName = $("<td class='hoverElement' title='" + keyWordStr + "'></td>");
      tdName.append(getPrettyName(name, false));
      button.click(function(e) {
        console.log(e.target.name)
        $("#tags").val(e.target.name);
        sendBookUpdateMsg("related", e.target.name);
        setBookName()
      });
      cartCheckbox.click(function(e) {
        bName = e.target.name;
        if (e.target.checked) {
          if (cart.indexOf(bName) == -1) {
            sendAddFavorite("related", bName);
            cart.push(bName);
          }
        } else {
          sendRemoveFavorite("related", bName);
          cart.splice(cart.indexOf(bName), 1);
        }
        updateCartTable();
        updateDoneButton();
        updateNeighbours();
      });
      tableContainter = $("<table class='borderless' width='100%'></table>");
      trContainer = $("<tr></tr>");
      trContainer.append(tdName);
      trContainer.append(tdCart);
      trContainer.append(tdButton);
      tableContainter.append(trContainer);
      innerTd = $("<td></td>");
      innerDiv = $("<div class='withborder'></div>");
      innerDiv.append(tableContainter);
      innerTd.append(innerDiv);
      tr.append(innerTd);
      $("#bookTable").append(tr);
    }
  };
  updateCartTable = function() {
    $("#cartTable").empty();
    tooltipText = localization["favoritesTooltip"][LANG];
    $("#cartTable").append("<tr><th>" + localization["favorites"][LANG] + " <img src=\"/public/img/help.png\" height=\"15px\" title='" + tooltipText + "'> </th><th></th></tr>");
    $("#cartTable").tooltip({
      open: function(event, ui) {
        sendOverBook("favorite", event);
      },
      close: function(event, ui) {
        sendOutBook("favorite", event);
      }
    });
    $.each(cart, function(key, name) {
      tr = $("<tr></tr>");
      keyWordStr = getDescriptionByKeywords(keywordDict[name], MAX_KEYWORDS_PER_BOOK);
      keyWordStr = "<b>Keywords: </b>" + keyWordStr;
      tdName = $("<td class='hoverElement' title='" + keyWordStr + "'></td>");
      tdName.append(getPrettyName(name, false));
      var cartCheckbox = $("<input type=\"checkbox\" title='<span class=\"author\">" + localization["favoritesButtonTooltip"][LANG] + "</span>' name=\"" + name + "\" checked>");
      var tdCart = $("<td width='60px' align='right'></td>");
      tdCart.append(cartCheckbox);
      cartCheckbox.click(function(e) {
        bName = e.target.name;
        if (e.target.checked) {
          if (cart.indexOf(bName) == -1) {
            cart.push(bName);
          }
        } else {
          sendRemoveFavorite("favorite", bName);
          cart.splice(cart.indexOf(bName), 1);
        }
        updateCartTable();
        updateDoneButton();
        updateNeighbours();
      });
      tableContainter = $("<table class='borderless' width='100%'></table>");
      trContainer = $("<tr></tr>");
      trContainer.append(tdName);
      trContainer.append(tdCart);
      tableContainter.append(trContainer);
      innerTd = $("<td></td>");
      innerDiv = $("<div class='withborder'></div>");
      innerDiv.append(tableContainter);
      innerTd.append(innerDiv);
      tr.append(innerTd);
      $("#cartTable").append(tr);
    });
  };
  removeRepeatedWords = function(line) {
    newLine = line.replace(/ kaunokki$/, '')
    newLine = newLine.replace(/ ysa$/, '')
    return newLine
  };
  getDescriptionByKeywords = function(keywords, maxKeywords) {
    out = "";
    for (k = 0; k < maxKeywords && k < keywords.length; k++) {
      out += removeRepeatedWords(keywords[k]) + ", ";
    }
    out = out.substring(0, out.length - 2);
    return out;
  };
  addControls = function() {
    i = 0;
    $.each(clusters, function(key, value) {
      if (addedControlArray.includes(key)) {
        return true;
      }
      if (i >= MAX_BUTTON_NUMBER) {
        return false;
      }
      i++;
      addedControlArray.push(key);
      addControl(key, value);
    });
    updateControlButtons();
  };
  makeControlContainerHeader = function() {
    tooltipText = localization["topicsTooltip"][LANG];
    $("#controlContainer").append("<tr><th>" + localization["topics"][LANG] + " <img src=\"public/img/help.png\" height=\"15px\" title='" + tooltipText + "'> </th><th></th></tr>");
    $("#controlContainer").tooltip();
  };
  restoreControls = function() {
    $("#controlContainer").empty();
    makeControlContainerHeader();
    for (key in addedControlArray) {
      value = clusters[key];
      addControl(key, value);
    }
    updateControlButtons();
  };
  stepTowards = function(oldCoordinates, destCoordinates, step) {
    newCoordinates = [];
    distance = getDistance(oldCoordinates, destCoordinates);
    for (ii = 0; ii < oldCoordinates.length; ii++) {
      newCoordinates.push(oldCoordinates[ii] + (destCoordinates[ii] - oldCoordinates[ii]) / distance * step);
    }
    return newCoordinates;
  };
  moveToCluster = function(key) {
    destinationCoordinates = clusters[key]["centroid"];
    //console.log(currentCoordinates);
    //console.log(destinationCoordinates);
    wholeDistance = getDistance(destinationCoordinates, currentCoordinates);
    if (wholeDistance < MIN_STEP) {
      currentCoordinates = [...destinationCoordinates];
      return;
    }
    smallStep = wholeDistance / GRANULARITY;
    if (smallStep < MIN_STEP) {
      smallStep = MIN_STEP;
    }
    coord = [];
    c = 0;
    same = true;
    for (step = smallStep; step <= wholeDistance; step += smallStep) {
      c++;
      coord = stepTowards(currentCoordinates, destinationCoordinates, step);
      if (!areNearestBooksTheSame(currentCoordinates, coord)) {
        same = false;
        break;
      } else {
        same = true;
      }
    }
    if (same) {
      currentCoordinates = [...destinationCoordinates];
    } else {
      currentCoordinates = [...coord];
    }
  };
  addControl = function(key, value) {
    tr = $("<tr></tr>");
    var text = getTextByBooks(value["books"]);
    text = localization["topicTooltip"][LANG] + text;
    var description = getDescriptionByKeywords(value["keywords"], MAX_KEYWORDS_PER_CLUSTER);
    var tdDescription = $("<td class='hoverElement' title=\"" + text + "\">" + description + "</td>");
    tdDescription.tooltip({
      open: function(event, ui) {
        sendOverTopic(event);
      },
      close: function(event, ui) {
        sendOutTopic(event);
      }
    }); //calculate length based on the number of characters
    var tdButton = $("<td width='60px'></td>");
    var button = $("<button onclick='sendMoreLikeThis(\"" + description + "\")' id=\"moreButton" + key + "\">" + localization["moreLikeThis"][LANG] + "</button>");
    button.click(function(e) {
      moveToCluster(key);
      //updateStepCoordinates(key);
      updateNeighbours();
      updateClusterButtons();
      saveHistory();
    });
    tdButton.append(button)
    tableContainter = $("<table class='borderless' width='100%'></table>");
    trContainer = $("<tr></tr>");
    trContainer.append(tdDescription);
    trContainer.append(tdButton);
    tableContainter.append(trContainer);
    innerTd = $("<td></td>");
    innerDiv = $("<div class='withborder'></div>");
    innerDiv.append(tableContainter);
    innerTd.append(innerDiv);
    tr.append(innerTd);
    $("#controlContainer").append(tr);
  };
  updateControlButtons = function() {
    if (addedControlArray.length >= Object.keys(clusters).length) {
      button = $("#moreControls");
      button.prop('disabled', true);
      //console.log("disable more controls " + addedControlArray.length);
    } else {
      $("#moreControls").prop('disabled', false);
      //console.log("enable more controls " + addedControlArray.length);
    }
    if (addedControlArray.length > MAX_BUTTON_NUMBER) {
      $("#lessControls").prop('disabled', false);
      //console.log("enable less controls " + addedControlArray.length);
    } else {
      $("#lessControls").prop('disabled', true);
      //console.log("disable less controls " + addedControlArray.length);
    }
  };
  addMoreControls = function() {
    addControls();
    saveHistory();
  };
  $("#moreControls").click(addMoreControls);
  removeControls = function() {
    $("#controlContainer").empty();
    makeControlContainerHeader();
    controlNumber = Math.ceil((addedControlArray.length) / MAX_BUTTON_NUMBER - 1);
    //console.log(controlNumber);
    addedControlArray = [];
    for (cn = 0; cn < controlNumber; cn++) {
      //console.log("added " + cn);
      addControls();
    }
    saveHistory();
  };
  $("#lessControls").click(removeControls);

  
  sortClusters = function(coordinates) {
    $.each(clusters, function(key, value) {
      var distance = getCosine(coordinates, value["centroid"]);
      value["dist"] = distance;
    });
    clusters.sort(function(a, b) {
      return b["dist"] - a["dist"];
    });
  }

  var createControls = function() {
    $("#controlContainer").empty();
    makeControlContainerHeader();
    addedControlArray = [];
    button = $("#moreControls");
    button.prop('disabled', false);
    sortClusters(currentCoordinates);
    addControls()
  };
  /*$("#clearButton").click(function () {
        $("#tags").val("")
    });*/
  //putting html content to tooltips
  $.widget("ui.tooltip", $.ui.tooltip, {
    options: {
      content: function() {
        return $(this).prop('title');
      }
    }
  });
  //human generated
  //customize like button: tomorrow
  //make a tutorial
  // find a famous book
  // come up with a script
  // program it
  // why not to mix books?
  // write an email suggesting that I will start on Monday
  diologClick = function() {
    $(this).dialog("close");
    entity = tutorialArray.pop();
    openDialog(entity);
  };
  openDialog = function(entity) {
    $("<div>" + entity["text"] + "</div>").dialog({
      dialogClass: "no-close",
      buttons: entity["buttons"],
      position: {
        "my": "left top",
        "at": "right bottom"
      }
    });
  }
  tutorialArray = [{
      "text": localization["tut10"][LANG],
      "buttons": [{
        text: localization["gotItButton"][LANG],
        click: diologClick
      }]
    },
    {
      "text": localization["tut9"][LANG],
      "buttons": [{
        text: localization["done"][LANG],
        click: diologClick
      }]
    },
    {
      "text": localization["tut8"][LANG],
      "buttons": [{
        text: localization["gotItButton"][LANG],
        click: diologClick
      }]
    },
    {
      "text": localization["tut7.new1"][LANG],
      "buttons": [{
        text: localization["gotItButton"][LANG],
        click: diologClick
      }]
    },
    {
      "text": localization["tut7"][LANG],
      "buttons": [{
        text: localization["gotItButton"][LANG],
        click: diologClick
      }]
    },
    {
      "text": localization["tut6"][LANG],
      "buttons": [{
        text: localization["done"][LANG],
        click: diologClick
      }]
    },
    {
      "text": localization["tut5"][LANG],
      "buttons": [{
        text: localization["yesButton"][LANG],
        click: diologClick
      }, {
        text: localization["noButton"][LANG],
        click: diologClick
      }]
    },
    {
      "text": localization["tut4.1"][LANG] + getPrettyName("Harry Potter ja Feeniksin kilta / J. K. Rowling ; suomentanut Jaana Kapari") +
        localization["tut4.2"][LANG],
      "buttons": [{
        text: localization["gotItButton"][LANG],
        click: diologClick
      }]
    },
    {
      "text": localization["tut3"][LANG],
      "buttons": [{
        text: localization["gotItButton"][LANG],
        click: diologClick
      }]
    },
    {
      "text": localization["tut2.1"][LANG] + getPrettyName("Harry Potter ja puoliverinen prinssi / J. K. Rowling ; suomentanut Jaana Kapari") +
        localization["tut2.2"][LANG],
      "buttons": [{
        text: localization["done"][LANG],
        click: diologClick
      }]
    },
    {
      "text": localization["tut1"][LANG],
      "buttons": [{
        text: localization["startButton"][LANG],
        click: diologClick
      }]
    }
  ];
  if (TUTORIAL_MODE) {
    entity = tutorialArray.pop();
    openDialog(entity)
  }
  //localization
  $("#task").html(localization["task"][LANG]);
  $("#moreControls").text(localization["moreTopics"][LANG]);
  $("#lessControls").text(localization["lessTopics"][LANG]);
  $("#undoButton").text(localization["undoButton"][LANG]);
  $("#pickButton").text(localization["relatedButton"][LANG]);
  $("#doneButton").val(localization["done"][LANG]);
  //init redirect
  pageName = "machine";
  parseParams();
  //parseNextPage();
  document.title = pageName;
  $("#path").val(path);
  $("#userId").val(userId);
  $("#navigationForm").attr('action', nextPage);
  // tracking events
  //sendStartMsg();
  $("#doneButton").click(sendEndMsg);
  toolTipPage = pageName + "Tooltip"
  $("#doneButton").click(sendFinalBooks);
  $("#pickButton").click(sendPickButtonMsg);
  $("#moreControls").click(sendMoreTopics);
  $("#lessControls").click(sendLessTopics);
  $("#appTitle").text(localization["title"][LANG] + " " + getAppNumber());
});