var SimpleEvents = require('more-events').Emitter;//require('./simple_events');

function Shell(){
    var shells = Array.prototype.slice.call(arguments),
        cb = shells.shift(),
        alive = true;

    if(cb === undefined)
        cb = function * (obj){ return obj; };

    var events = new SimpleEvents();

    function callshell(pre){


        return new Promise(function(resolve, reject){

            var gen, obj = {};

            function fn(next){
                if(next.done){
                    if(next.value.then){
                        return next.value.then(function(value){
                            resolve(value);
                        });
                    }else{
                        return resolve(next.value);
                    }
                }

                if(next.value.then){
                    next.value.then(function(value){
                        fn(gen.next(value));
                    }, function(e){
                        fn(gen.throw(e));
                    });
                }else{
                    gen.next(next.value);
                }
            }

            prepareInput();

            function prepareInput(){
                var result;
                if(typeof pre === 'function'){
                    //Use co-routines, or async-await for this!
                    //Get a model with async control.
                    pre().then(start, function(e){
                        return Promise.reject(e);
                    });
                }else if(typeof pre.then === 'function'){
                    //The input is a thenable.
                    //Propably an async function.
                    pre.then(start, function(e){
                        return Promise.reject(e);
                    });
                }else{
                    start(pre);
                }
            }

            function start(obj2){
                var type = Object.prototype.toString.call(obj2), list;
                if(type === '[object Object]'){
                    for(var n in obj2){
                        obj[n] = obj2[n];
                    }
                }else if(type === '[object Array]'){
                    for(var i=0; i<obj2.length; i++){
                        obj[i] = obj2[i];
                    }
                }else{
                    obj = obj2;
                }


                if(shells && shells.length){
                    //This is called composition.
                    //All members bubble destruction.
                    list = new Array(shells.length);

                    for(var i=0; i<shells.length; i++){
                        if(typeof shells[i].exec !== 'function'){
                            throw new Error('exec method was not found on '+shells[i]);
                        }
                        list[i] = shells[i].exec(obj);
                    }

                    Promise.all(list).then(function(list){
                        if(obj !== undefined){
                            list.unshift(obj);
                        }
                        //Add the object to the arguments.
                        //list.unshift(obj);
                        run(list);
                    });
                }else{
                    list = [];
                    if(obj !== undefined){
                        list = [obj];
                    }
                    run(list);
                }
            }

            function run(args){
                gen = cb.apply(null, args);
                if(typeof gen.next === 'function'){
                    fn(gen.next());
                }else if(typeof gen.then === 'function'){
                    //Skip recursive fn call.
                    //cb is probably an async function.
                    gen.then(function(value){
                        resolve(value);
                    }, function(e){
                        resolve(Promise.reject(e));
                    }).catch(function(e){
                        resolve(Promise.reject(e));
                    });
                }
            }


        });
    }

    function exec(obj){
        if(!alive)
            return Promise.resolve(undefined);
        return callshell.call(this, obj).then(function(value){
            events.emit('exec', obj, value);
            return value;
        });
    }

    function include(){
        for(var i=0; i<arguments.length; i++){
            shells.push(arguments[i]);
        }
        return this;
    }

    function erase(){
        shells = [];
        alive = false;
        return this;
    }

    function on(event, cb){
        events.on(event, cb);
        return this;
    }

    function destroy(){
        if(!alive)
            return;
        alive = false;
        for(var i=0; i<shells.length; i++)
            shells[i].destroy();
        events.emit('destroy');
        events = null;
        shells = null;
        cb = null;
    }

    return Object.create({
        exec: exec,
        include: include,
        erase: erase,
        on: on,
        destroy: destroy
    });
}

module.exports = Shell;
