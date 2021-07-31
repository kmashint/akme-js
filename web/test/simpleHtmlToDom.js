function simpleHtmlToDom(html) {
  var rootNode = document.createElement("div"),
    thisNode = rootNode,
    nextNode;
     
  String(html).split(/(<[\w\/-]+>)/m).forEach(function (str) {
    if (thisNode == null) return;
    if (str.startsWith("</")) {
      thisNode = thisNode.parentNode;
    }
    else if (simpleHtmlToDom.ALLOW_TAGS.test(str)) {
      nextNode = document.createElement(str.substring(1, str.length-1));
      thisNode.appendChild(nextNode);
      thisNode = nextNode;
    }
    else thisNode.appendChild(document.createTextNode(str));
  });
  return rootNode;
}
simpleHtmlToDom.ALLOW_TAGS = /^<(?:b|br\/|i)>$/;
 
// In reality, use the returned DOM object, don't use innerHTML as below which is just to debug the sample.
console.log(simpleHtmlToDom("Hello <b>Joe</b><script>alert(1)</script>!").innerHTML);
