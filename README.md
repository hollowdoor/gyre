install
-------

`npm install --save gyre`

Usage
-----

###index.html

```html
<!DOCTYPE html>
<html>
    <head>
    <title>hello order!</title>
    </head>
<body>

    <button id="insert-name">View Name</button>
    <button id="insert-name-gender">View name, and gender</button>
    <button id="insert-all">View all</button>
    <div id="allviews"></div>
    <script src="script.shell.js"></script>
  </body>
</html>
```

###script.shell.js

Passing a generator function to `$$.shell` creates a co-routine. This example uses the [then-fs](https://www.npmjs.com/package/then-fs) module. It also uses es2015 template strings which are available in [electron](http://electron.atom.io/) at least -- while there are various levels of support for browsers.

```javascript
var fs = require('then-fs'),
    readJSON = function(name){
        return fs.readFile(name, 'utf8').then(JSON.parse);
    };

var $$ = require('../index');


var fullName = $$.shell(function * (person){
    return `Name: ${person.name.first} ${person.name.last}`;
});

var nameHTML = $$.shell(function * (person, name){
    return `<li class="person-name">${name}</li>`;
});

nameHTML.include(fullName);

var nameWithGender = $$.shell(function * (person, nameHTML){
    return `${nameHTML}
            <li>Gender: ${person.gender}</li>`;
});
var all = $$.shell(function * (person, nameWithGender){
    return `${nameWithGender}
            <li>Phone: ${person.phone}</li>
            <li>Favorite Animal: ${person.favoriteAnimal}</li>
            <li>Bio: ${yield fs.readFile(person.biofile, 'utf8')}</li>`;
});

all.on('exec', function(person, info){
    var view = document.querySelector('#allviews');
    view.innerHTML = info;
});

nameWithGender.include(nameHTML);
all.include(nameWithGender);


document.querySelector('#insert-name').addEventListener('click', function(){

    var view = document.querySelector('#allviews');
    nameHTML.exec(readJSON('./person.json')).then(function(info){
        view.innerHTML = info;
    });
}, false);

document.querySelector('#insert-name-gender').addEventListener('click', function(){
    var view = document.querySelector('#allviews');
    nameWithGender.exec(readJSON('./person.json')).then(function(info){
        view.innerHTML = info;
    });
}, false);
document.querySelector('#insert-all').addEventListener('click', function(){
    var view = document.querySelector('#allviews');
    all.exec(readJSON('./person.json'));/*.then(function(val){
        view.innerHTML = val;
    });*/
}, false);

```

###$$.shell(generator, function, asyncFunction) -> shell Object

`$$.shell` is a factory. These are the things you can pass to it.

-	Generator
-	Promise returning function
-	async/await type functions

Once you've created an object with it you can now access some methods.

`shell.include(shell, ...) -> this`

**include** is a special function for adding parameters to the calling object.

For instance:

```javascript
var fullName = $$.shell(function * (person){
    return `Name: ${person.name.first} ${person.name.last}`;
});

var nameHTML = $$.shell(function * (person, name /*This argument is added by include*/){
    return `<li class="person-name">${name}</li>`;
});

nameHTML.include(fullName);

```

**Very Important**: In that last example the return value of `fullName` becomes the argument value of the parameter `name` in `nameHTML`. With co-routines this mechanism of extending arguments is a very important ability of gyre shells. It's what allows the composition of shells into a much larger series of operations.

`shell.erase() -> this` is the opposite of include. It erases all arguments.

Use `shell.exec(object) -> this` to run the shell co-routine.

`shell.on(string, function) -> this` allows you to set at least one event named `exec`.

`shell.destroy() -> undefined`

The nuclear option. The destroyed **shell** as well as it's child arguments set through **include** are all rendered ineffective permanently by `destroy`.

A promise will still be returned from `exec` after `destroy` is called, but it will resolve to an undefined value for for the rest of the programs life. Reassign the variable or something after a `destroy` call.

###shell events

These are the events that shells emit.

-	exec
-	destroy

###co-routines

Keep in mind that unlike the **co** library you can only yield promises to perform asynchronous operations. Any other value is treated as a synchronous value.

As an alternative creation mechanism you can use async/await.

```javascript
var myShell = $$.shell(async function(obj){
    //Do some waiting in here.
});
myShell.exec('some data to work with like maybe an array of file names');

```

###$$.state()

```javascript
//Create a new state manager.
var states = $$.state();
```

Use `states.add(String|RegExp, shell)` to use states.

The shell object returned by **gyre** has the `exec`, and `destroy` methods so it is compatible with **carefree-states**.

Visit the [carefree-states](https://www.npmjs.com/package/carefree-states) module to learn more about states.

About
-----

gyre uses composition to create functions that have growing **arity**. I call these functions of growing arity **shells** due to their layered appearance.

For you functional programming aficionados out there this could be considered the opposite of partial application. Though in the end it comes full circle with the exec function to a true partial.

What's it for?
--------------

Wow! I agonized over what to call these things for a couple days. You'll think of something.

I can at least tell you I made gyre to use in the **[electron](http://electron.atom.io/)** framework. In my opinion this is where it will shine as a template organizer, and model manager.

Happy coding!
