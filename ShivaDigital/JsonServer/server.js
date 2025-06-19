// Place this as server.js in your JsonServer folder
const jsonServer = require('json-server');
const path = require('path');
const server = jsonServer.create();
const router = jsonServer.router(path.join(__dirname, 'db.json'));
const middlewares = jsonServer.defaults();

// Sync id and mgr_CustomerID on POST/PUT
server.use(jsonServer.bodyParser);
server.use((req, res, next) => {
  if ((req.method === 'POST' || req.method === 'PUT') && req.body) {
    // If neither id nor mgr_CustomerID is present, auto-increment based on the highest existing value
    if (!req.body.id && !req.body.mgr_CustomerID) {
      const customers = router.db.get('customers').value();
      const maxId = customers.length > 0 ? Math.max(...customers.map(c => c.mgr_CustomerID || c.id || 0)) : 0;
      req.body.id = req.body.mgr_CustomerID = maxId + 1;
    } else if (req.body.mgr_CustomerID && !req.body.id) {
      req.body.id = req.body.mgr_CustomerID;
    } else if (req.body.id && !req.body.mgr_CustomerID) {
      req.body.mgr_CustomerID = req.body.id;
    }
  }
  next();
});

server.use(middlewares);
server.use(router);

server.listen(36500, () => {
  console.log('JSON Server is running on port 36500');
});
