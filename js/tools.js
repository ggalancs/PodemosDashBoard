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
