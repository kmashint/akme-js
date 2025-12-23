// Test some other Microsoft functionality.
// cscript //nologo AkmeSpVoice.js
//
var voc = WScript.CreateObject("SAPI.SpVoice");
var msg = "Greetings Professor Faulken.  Shall we play a game?";
// Faulken is better pronounced although it's spelled Falken.
WScript.Echo(msg);
voc.Speak(msg);
(function callback(voc) { if (!voc.WaitUntilDone(100)) setTimeout(callback, 0); })(voc);
