function getExtremeDates(dateAux){
  if (dateAux < minDate){
    minDate=dateAux;
  }
  if (dateAux > maxDate){
    maxDate=dateAux;
  }
}

function getExtremeValues(valueAux){
  var value=parseInt(valueAux)
  if (value < minValue){
    minValue=value;
  }
  if (value > maxValue){
    maxValue=value;
  }
}

function parseParam(val) {
    var result = "Not found",
        tmp = [];
    var items = location.search.substr(1).split("&");
    for (var index = 0; index < items.length; index++) {
        tmp = items[index].split("=");
        if (tmp[0] === val) result = decodeURIComponent(tmp[1]);
    }
    return result;
}
