// (function () {

//     "use strict";

//     /* =========================================================
//        HAPROVEN CORE LOADER
//        Base64 encoded paths
//     ========================================================= */

//     const decode = function (value) {
//         return atob(value);
//     };

//     const files = [

//         // auth.js
//         "aHR0cHM6Ly9jb2RlcnN1c2hlZWwuZ2l0aHViLmlvL2hhcHJvYmFzZS9leHRlcm5hbC9qcy9hdXRoL2F1dGguanM=",

//         // script.js
//         "aHR0cHM6Ly9jb2RlcnN1c2hlZWwuZ2l0aHViLmlvL2hhcHJvYmFzZS9leHRlcm5hbC9qcy9zY3JpcHQuanM=",

//         // page-loader.js
//         "aHR0cHM6Ly9jb2RlcnN1c2hlZWwuZ2l0aHViLmlvL2hhcHJvYmFzZS9leHRlcm5hbC9qcy9wYWdlLWxvYWRlci5qcw==",

//         // global.js
//         "aHR0cHM6Ly9jb2RlcnN1c2hlZWwuZ2l0aHViLmlvL2hhcHJvYmFzZS9leHRlcm5hbC9qcy9hcGkvZ2xvYmFsLmpz"

//     ];

//     files.forEach(function (encoded) {

//         const src = decode(encoded);

//         document.write(
//             '<script src="' + src + '"><\/script>'
//         );

//     });

// })();
