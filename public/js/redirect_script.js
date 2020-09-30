var userId, path, nextPage, langParam;
    parseParams = function(){
      info = window.location.search.substr(1).split("&");
      $.each(info, function(key, val) {
        params = val.split("=")
        if (params[0] == "userId") {
          userId = params[1];
        }
        if (params[0] == "path") {
          path = params[1];
        }
        if (params[0] == "lang") {
          langParam = params[1];
        }
      })
    };

    parseNextPage = function() {
      pages = path.split(".");
      for(pp = 0; pp < pages.length; pp++){
        if(pages[pp] == pageName){
          break;
        }
      }
      nextPage = pages[pp + 1]+".html";
    };

    getAppNumber = function(){
      pages = path.split(".");
      for(pp = 0; pp < pages.length; pp++){
        if(pages[pp] == pageName){
          break;
        }
      }
      if(pp == 2 || pp == 3) {
          return 1;
      }
      if(pp == 5 || pp == 6) {
          return 2;
      }
      if(pp == 8 || pp == 9) {
          return 3;
      }
    }