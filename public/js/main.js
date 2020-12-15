$(document).ready(function(){
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
  addedControlArray = [];
  appHistory = [];
  currentCoordinates = [];
  cart = [];
  currentBook = "";

  $("#tags").autocomplete({
    source: names,
	  minLength: 3
  });

  $.ajaxSetup({
    beforeSend:function(){
        $("#loading").show();
    },
    complete:function(){
        $("#loading").hide();
    }
  });

  updateDoneButton = function() {
    if (cart.length == 0) {
      $("#doneButton").prop('disabled', true);
    } else {
      $("#doneButton").prop("disabled", false);
    }
  };

  getDescriptionByKeywords = function(keywords, maxKeywords) {
    out = "";
    for (k = 0; k < maxKeywords && k < keywords.length; k++) {
      out += removeRepeatedWords(keywords[k]) + ", ";
    }
    out = out.substring(0, out.length - 2);
    return out;
  };

  removeRepeatedWords = function(line) {
    newLine = line.replace(/ kaunokki$/, '')
    newLine = newLine.replace(/ ysa$/, '')
    return newLine
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

  var createControls = function() {
    $("#controlContainer").empty();
    makeControlContainerHeader();
    addedControlArray = [];
    button = $("#moreControls");
    button.prop('disabled', false);
    sortClusters(currentCoordinates);
    addControls()
  };

  makeControlContainerHeader = function() {
    tooltipText = localization["topicsTooltip"][LANG];
    $("#controlContainer").append("<tr><th>" + localization["topics"][LANG] + " <img src=\"public/img/help.png\" height=\"15px\" title='" + tooltipText + "'> </th><th></th></tr>");
    $("#controlContainer").tooltip();
  };

  sortClusters = function(coordinates) {
    $.each(clusters, function(key, value) {
      var distance = getCosine(coordinates, value["centroid"]);
      value["dist"] = distance;
    });
    clusters.sort(function(a, b) {
      return b["dist"] - a["dist"];
    });
  }

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
      cord = JSON.stringify(currentCoordinates);
      destcord = JSON.stringify(clusters[key]["centroid"]);
      $.ajax({
  		url: "/morelikethis",
  		cache: false,
  		type: 'POST', 
        data: {destcord:destcord, curcor:cord}, 
        success: function(data){
           distArray = data.dist;
           currentCoordinates = data.curcor;
           updateNeighbours(); 
    	   updateClusterButtons();
           saveHistory();
        }
        , error: function(jqXHR, textStatus, err){
          //alert('text status '+textStatus+', err '+err)
       }
  	  });
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

  getTextByBooks = function(books) {
    var text = "";
    $.each(books, function(key, value) {
      text += getPrettyName(value, true) + "<br>";
    });
    return text;
  };

  updateControlButtons = function() {
    if (addedControlArray.length >= Object.keys(clusters).length) {
      button = $("#moreControls");
      button.prop('disabled', true);
    } else {
      $("#moreControls").prop('disabled', false);
    }
    if (addedControlArray.length > MAX_BUTTON_NUMBER) {
      $("#lessControls").prop('disabled', false);
    } else {
      $("#lessControls").prop('disabled', true);
    }
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

  areCoordinatesTheSame = function(coord1, coord2) {
    for (i = 0; i < coord1.length; i++) {
      if (coord1[i] != coord2[i]) {
        return false;
      }
    }
    return true;
  };

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
      tableContainter = $("<table class='borderless' width='100%'></table>");
      trContainer = $("<tr></tr>");
      trContainer.append(tdName);
      tableContainter.append(trContainer);
      innerTd = $("<td></td>");
      innerDiv = $("<div class='withborder'></div>");
      innerDiv.append(tableContainter);
      innerTd.append(innerDiv);
      tr.append(innerTd);
      $("#cartTable").append(tr);
    });
  };

  getDistance = function(coord1, coord2) {
    dist = 0;
    for (i = 0; i < coord1.length; i++) {
      dist += (coord1[i] - coord2[i]) * (coord1[i] - coord2[i])
    }
    dist = Math.sqrt(dist);
    return dist;
  };

  stepTowards = function(oldCoordinates, destCoordinates, step) {
    newCoordinates = [];
    distance = getDistance(oldCoordinates, destCoordinates);
    for (ii = 0; ii < oldCoordinates.length; ii++) {
      newCoordinates.push(oldCoordinates[ii] + (destCoordinates[ii] - oldCoordinates[ii]) / distance * step);
    }
    return newCoordinates;
  };

  areNearestBooksTheSame = function(coord1, coord2) {
    list1 = getNeighbourArray(coord1);
    list2 = getNeighbourArray(coord2);
    for (jj = 0; jj < list2.length; jj++) {
      name1 = list1[jj]["obj"]["books"][0]["name"]
      name2 = list2[jj]["obj"]["books"][0]["name"]
      if (name1 != name2) {
        return false;
      }
    }
    return true;
  };

  addMoreControls = function() {
    addControls();
    saveHistory();
  };

  removeControls = function() {
    $("#controlContainer").empty();
    makeControlContainerHeader();
    controlNumber = Math.ceil((addedControlArray.length) / MAX_BUTTON_NUMBER - 1);
    addedControlArray = [];
    for (cn = 0; cn < controlNumber; cn++) {
      addControls();
    }
    saveHistory();
  };

  $("#moreControls").click(addMoreControls);
  $("#lessControls").click(removeControls);

  var updateNeighbours = function() {
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
      var tdButton = $("<td width='60px' align='right'></td>")
      tdButton.append(button)
      //var tdName = $("<td class='hoverElement' title='" + keyWordStr + "'></td>");
      var tdName = $("<td class='hoverElement'></td>");
      var bookLink = $("  <a class='book-details' target='_blank' href='/bookdetails/" + name + "'>Read more >></a>");
      tdName.append(getPrettyName(name, false));
      tdName.append(bookLink)
      button.click(function(e) {
        e.preventDefault();
  		$("#tags").val(e.target.name); 		
  		currentBook = e.target.name;
  		inputValue = currentBook;
        $.ajax({
	  		url: "/showrelated",
	  		cache: false,
	  		type: 'POST', 
	        data: {"input":inputValue}, 
	        success: function(data){
	           distArray = data.dist;
	           currentCoordinates = data.curcor;
	           if (!INITIATED) {
			      $("#mainTable").css("display", "initial");
			      INITIATED = true;
	    	   }
	           updateNeighbours();
	           createControls();
	    	   updateClusterButtons();
	           saveHistory();
	           updateCartTable();
	          }
	        , error: function(jqXHR, textStatus, err){
	          //alert('text status '+textStatus+', err '+err)
	         }
  		});
  		sendBookUpdateMsg("related", e.target.name);
      });
      tableContainter = $("<table class='borderless' width='100%'></table>");
      trContainer = $("<tr></tr>");
      trContainer.append(tdName);
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

  $("#pickButton").click(function(e){
  	e.preventDefault();
  	var inputValue = $("#tags").val();
  	//check if value is not in array
  	if (!names.includes(inputValue)) {
  		if ($("#bookNotFound").is(":empty")) {
  			$("#bookNotFound").append("This book is not available. As you type, the dropdown appears. Please select a book from the dropdown.");
  		}
  		return;
  	}
  	currentBook = inputValue;

  	$.ajax({
  		url: "/getrelated",
  		cache: false,
  		type: 'POST', 
        data: {"input":inputValue}, 
        success: function(data){
           distArray = data.dist;
           currentCoordinates = data.curcor;
           if (!INITIATED) {
		      $("#mainTable").css("display", "initial");
		      INITIATED = true;
    	   }
           updateNeighbours();
           createControls();
    	   updateClusterButtons();
           saveHistory();
           updateCartTable();
           $("#bookNotFound").empty();
        }
  	});
  });

  //putting html content to tooltips
  $.widget("ui.tooltip", $.ui.tooltip, {
    options: {
      content: function() {
        return $(this).prop('title');
      }
    }
  });

  //localization
  $("#task").html(localization["task"][LANG]);
  $("#moreControls").text(localization["moreTopics"][LANG]);
  $("#lessControls").text(localization["lessTopics"][LANG]);
  $("#undoButton").text(localization["undoButton"][LANG]);
  //$("#pickButton").text(localization["relatedButton"][LANG]);
  $("#doneButton").val(localization["done"][LANG]);
  //init redirect
  pageName = "ClusterExplorer";
  parseParams();
  //parseNextPage();
  document.title = pageName;
  $("#path").val(path);
  $("#userId").val(userId);
  $("#navigationForm").attr('action', nextPage);
  // tracking events
  sendStartMsg();
  $("#doneButton").click(sendEndMsg);
  toolTipPage = pageName + "Tooltip"
  $("#doneButton").click(sendFinalBooks);
  $("#pickButton").click(sendPickButtonMsg);
  $("#moreControls").click(sendMoreTopics);
  $("#lessControls").click(sendLessTopics);


});