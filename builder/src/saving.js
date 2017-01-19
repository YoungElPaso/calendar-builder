import loki from 'lokijs';

class Database {

   
    create() {
        console.log('Instantiating a LokiJS DB.');
        // Have to override env. for some reason.
        // Also, dont really want autosave yet...
        var db = new loki('saves', {
            env: 'BROWSER',
            // autosave: true,
            // autosaveInterval: 10000,
            // autoload: true,
            // autoloadCallback: this.doLoad,
        });

        // // Once DB is loaded, does some stuff. Basically handles first load.
        // function loadHandler() {
        //     console.log('Loading DB from localstorage.');
        //     var saves = db.getCollection('saves');
        //     if (saves) {
        //         console.log('DB has a collection already.');
        //     }
        //     else {
        //         console.log('No collection yet! creating.');
        //         db.addCollection('saves', 
        //             {
        //             clone: false,
        //             unique: 'id',
        //             indices:['id', 'state']
        //             }
        //         );
        //     }
        // }

        // Assign db to Database.
        this.setDb(db);
    }

    checkCollections(db, col) {
        var colBool = false;
        db.loadDatabase(null,
            function(){
                colBool = db.getCollection(col) !== null;
        });
        return colBool;
    }

    writeToSaves(db, col, doc, op) {
        var collection = db.getCollection(col);
        // Make sure we catch errors.
        if (op == 'w') {
            try {
                collection.insert(doc);
                return true;
            } catch (e) {
                return false;
            }
        }
        else if (op == 'u') {
            // console.log('updated?');
            // gotta retrieve original, map changes to it, then update.
            var oldDoc = collection.where(function(obj){
                return obj.titleHash == doc.titleHash;
            });
            oldDoc = oldDoc[0];
            var newDoc = oldDoc;
            newDoc.state = doc.state;
            // console.log('updateing...', oldDoc, doc, newDoc); 
            collection.update(newDoc);
        }
    }

    // holder = {};

    // static setResults(res) {
    //     this.
    // }

    setDb(db) {
        this.holder = db; 
    }

    getDb() {
        return this.holder;
    }

    // Just loads the DB from localstorage.
    doLoad() {
        var db = this.holder;
        // console.log('doing load here now', db);
        // Async call to load and then look at results.
        // console.log(this);
        // var that = this;
        // WHy doesn't this work? Should be able to wrap in anon function!
        // db.loadDatabase(null,
        // function(that, db){
        //     console.log('thisser', that);
        //     that.getResults(that, db);
        // });
        var resultsFunction = this.getResults;
        var self = this;
        // Wrap in anon function so can pass appropriate callback.
        db.loadDatabase(null,
        function(){
            // See if we have saves...
            var saves = db.getCollection('saves');
            if (saves) {
                console.log('DB has a collection already.');
                // So go get em.
                resultsFunction(db, self);
            }
            else {
                console.log('No collection yet! creating.');
                db.addCollection('saves', 
                    {
                    clone: false,
                    unique: 'titleHash',
                    indices:['id', 'title', 'titleHash', 'state']
                    }
                );
                db.saveDatabase();
                console.log('collection should be added.', db);

            }
        });
        return self;
    }

    getAResult(db, self, doc) {
        console.log('getting single result');
        var res = [];
        db.loadDatabase();
            // function(){
        // });
        var saves = db.getCollection('saves');
        res = saves.where(function(obj){
            return obj.titleHash == doc.titleHash;
        });
        return res[0];
    }
    
    // Looks at results in the loaded DB.
    getResults(db, self) {
        // console.log(db);
        // var db = this.getDb();
        // console.log('results', db);
        // Get a list of saves.
        console.log('getting results for ', db);
        var saves = db.getCollection('saves');
        // Load all the saves that have a state (should be all).
        self.results = saves.where(function(obj){
            return obj.state !== null;
        })
        console.log('results:', self.results);
        return self;
    }

    /* 
    Would have liked to organize this a bit better, so methods are all on Database obj.  TODO: try again later.
    loadHandler() {
         console.log('loaded the db', this);
     }
     */
}

export default Database;