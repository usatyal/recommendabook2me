/*
pageName - page, where the data came from
userId - user id
timestamp - action timestamp
action - what has been done: click, hover...
element - html element that received the action
value - value of the action: book title, selected book...
*/

ACTION_INIT = "userInit" // new user started script
ACTION_START = "start" // start
ACTION_END = "end" // leaving the page
ACTION_RADIO_CHECKED = "radioChecked" // checked answer (value) to questions (element)
ACTION_COMMENT = "comment" // focus out text area with text (value)
ACTION_BOOK_UPDATE = "bookUpdate" // book has changed to a new book (value), which comes from element (related, search or undo)
ACTION_FINAL_BOOKS = "finalBooks" // finally selected books (value)
ACTION_ADD_FAVORITE = "addFavorite" // add a favorite book (value) from element (related)
ACTION_REMOVE_FAVORITE = "removeFavorite" // remove a favorite book (value) from element (related, favorite)
ACTION_MORE_LIKE_THIS = "moreLikeThis" // clicked on more like this of topic (value)
ACTION_OVER_TOPIC = "overTopic" // mouse over topic (value)
ACTION_OUT_TOPIC = "outTopic" // mouse out topic (value)
ACTION_OVER_BOOK = "overBook" // mouse over book (value) from related or favorite (element)
ACTION_OUT_BOOK = "outBook" // mouse out topic (value) from related or favorite (element)
ACTION_MORE_TOPICS = "moreTopics" // more topics
ACTION_LESS_TOPICS = "lessTopics" // less topics
ACTION_ERROR = "error" // wrong book name

buildDataToSend = function (element, value, action) {
      dataToSend = {
        "pageName": pageName,
        "userId": userId,
        "timestamp": new Date().getTime(),
        "action" : action,
        "element" : element,
        "value" : value
      };
      return dataToSend;
    };

buildTooltipDataToSend = function (element, value, action) {
      dataToSend = {
        "pageName": toolTipPage,
        "userId": userId,
        "timestamp": new Date().getTime(),
        "action" : action,
        "element" : element,
        "value" : value
      };
      return dataToSend;
    };

    sendData = function (element, value, action) {
      dataToSend = buildDataToSend(element, value, action);
      if(action == ACTION_OVER_TOPIC || action == ACTION_OUT_TOPIC || action == ACTION_OVER_BOOK || action == ACTION_OUT_BOOK) {
        dataToSend = buildTooltipDataToSend(element, value, action);
      }
      //console.log(dataToSend);
      /*$.post("/controller.php", dataToSend).done(function(data) {
        console.log(data)
      }).fail(function() {
        $("#errorField").html("No connection to the server")
      })*/
    };

    sendStartMsg = function () {
        //console.log("sendStartMsg");
        sendData("none", path, ACTION_START);
    };

    sendEndMsg = function () {
        sendData("none", "none", ACTION_END);
    };

    sendRadioAnswer = function(radio) {
        element = radio.name;
        value = radio.value;
        sendData(element, value, ACTION_RADIO_CHECKED);
    };

    sendTextAreaText = function(textArea) {
        element = "textArea";
        value = textArea.value;
        sendData(element, value, ACTION_COMMENT);
    };




    sendPickButtonMsg = function(){
        sendBookUpdateMsg("search", $( "#tags" ).val());
    };

    sendBookUpdateMsg = function (element, value) {
        sendData(element, value, ACTION_BOOK_UPDATE);
    };

    sendFinalBooks = function(){
        sendData("none", cart, ACTION_FINAL_BOOKS);
    };

    sendAddFavorite = function(element, book){
        sendData(element, book, ACTION_ADD_FAVORITE);
    };

    sendRemoveFavorite = function(element, book){
        sendData(element, book, ACTION_REMOVE_FAVORITE);
    };

    sendMoreLikeThis = function(topic) {
        sendData("topic", topic, ACTION_MORE_LIKE_THIS);
    };

    sendMoreTopics = function() {
        sendData("none", "none", ACTION_MORE_TOPICS);
    };

    sendLessTopics = function() {
        sendData("none", "none", ACTION_LESS_TOPICS);
    };

    sendOverTopic = function(event) {
        topic = "none"
        if(event != null && event.originalEvent != null && event.originalEvent.toElement != null){
            topic = event.originalEvent.toElement.innerText;
        }
        sendData("topic", topic, ACTION_OVER_TOPIC);
    };

    sendOutTopic = function(event) {
        topic = "none"
        if(event != null && event.originalEvent != null && event.originalEvent.toElement != null){
            topic = event.originalEvent.toElement.innerText;
        }
        sendData("topic", topic, ACTION_OUT_TOPIC);
    };

    sendOverBook = function(element, event) {
        book = "none"
        if(event != null && event.originalEvent != null && event.originalEvent.toElement != null){
            book = event.originalEvent.toElement.innerText;
        }
        sendData(element, book, ACTION_OVER_BOOK);
    };

    sendOutBook = function(element, event) {
        book = "none"
        if(event != null && event.originalEvent != null && event.originalEvent.toElement != null){
            book = event.originalEvent.toElement.innerText;
        }
        sendData(element, book, ACTION_OUT_BOOK);
    };

    sendError = function(text) {
        sendData("none", text, ACTION_ERROR);
    };
