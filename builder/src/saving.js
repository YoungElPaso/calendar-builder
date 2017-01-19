import loki from 'lokijs';

class Database {

   
    create() {
        // console.log('Instantiating a LokiJS DB.');
        // Have to override env. for some reason.
        // Also, dont really want autosave yet...
        var db = new loki('saves', {
            env: 'BROWSER',
            // autosave: true,
            // autosaveInterval: 10000,
            // autoload: true,
            // autoloadCallback: this.doLoad,
        });
       
        // Assign db to Database object.
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
            // gotta retrieve original, map changes to it, then update.
            var oldDoc = collection.where(function(obj){
                return obj.titleHash == doc.titleHash;
            });
            oldDoc = oldDoc[0];
            var newDoc = oldDoc;
            newDoc.state = doc.state;
            collection.update(newDoc);
        }
    }

    setDb(db) {
        this.holder = db; 
    }

    getDb() {
        return this.holder;
    }

    // Just loads the DB from localstorage.
    doLoad() {
        var db = this.holder;
        var resultsFunction = this.getResults;
        var self = this;
        // Wrap in anon function so can pass appropriate callback.
        db.loadDatabase(null,
        function(){
            // See if we have saves...
            var saves = db.getCollection('saves');
            if (saves) {
                // So go get em.
                resultsFunction(db, self);
            }
            else {
                db.addCollection('saves', 
                    {
                    clone: false,
                    unique: 'titleHash',
                    indices:['id', 'title', 'titleHash', 'state']
                    }
                );
                db.saveDatabase();
            }
        });
        return self;
    }

    getAResult(db, self, doc) {
        var res = [];
        db.loadDatabase();
        var saves = db.getCollection('saves');
        res = saves.where(function(obj){
            return obj.titleHash == doc.titleHash;
        });
        return res[0];
    }
    
    // Looks at results in the loaded DB.
    getResults(db, self) {
        // Get a list of saves.
        var saves = db.getCollection('saves');
        // Load all the saves that have a state (should be all).
        self.results = saves.where(function(obj){
            return obj.state !== null;
        })
        return self;
    }

}

export default Database;