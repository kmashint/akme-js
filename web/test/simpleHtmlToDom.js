function simpleHtmlToDom(html) {
  var rootNode = document.createDocumentFragment(),
    thisNode = rootNode,
    nextNode;
 
  // Valid XML Names match /^[\w:][\w:.-]*/ && !/^\d/ where the first char cannot be a digit.
  // We just need a valid superset at first and then be strict about the valid subset later.
  String(html).split(/(<\/?[\w:.-]+\/?>)/m).forEach(function (str) {
    if (thisNode == null) return;
    if (str.startsWith("</")) {
      thisNode = thisNode.parentNode;
    }
    else if (simpleHtmlToDom.ALLOW_TAGS.test(str)) {
      nextNode = document.createElement(str.substring(1, str.length - (str.endsWith("/>") ? 2 : 1)));
      thisNode.appendChild(nextNode);
      if (!str.endsWith("/>")) thisNode = nextNode;
    }
    else thisNode.appendChild(document.createTextNode(str));
  });
  return rootNode;
}
simpleHtmlToDom.ALLOW_TAGS = /^<(?:b|br|code|dd|del|dl|dt|i|ins|kbd|li|ol|p|pre|samp|ul|var)\/?>$/;
 
// In reality, use the returned DOM object, don't use innerHTML as below which is just to debug the sample.
var div = document.createElement("div");
div.appendChild(simpleHtmlToDom("Hello <b>Joe</b>!<br/><script>alert(1)</script>!"));
console.log(div.innerHTML);
