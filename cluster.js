const cluster = require('cluster');

if (cluster.isMaster) {
	const workers = require('dotenv').config({ path: __dirname + '/.env' }).parsed.WORKERS;

	let cCPUs = workers > 0 ? workers : require('os').cpus().length;
	let main_worker_id = 1;

	// Create a worker for each CPU
	for (let i = 0; i < cCPUs; i++) {
		cluster.fork();
	}

	cluster.on('online', function (worker) {
		// Send start message to all workers and update last_worker_id. This is called from a worker's main thread
		worker.send({ topic: 'start', value: worker.id === main_worker_id });

		// log
		console.log(`Worker ${worker.process.pid} is online.`);
	});

	cluster.on('exit', function (worker, code, signal) {
		// Fork and report died. This is called by a worker that dies before the worker is removed
		const new_worker = cluster.fork();

		if (worker.id === main_worker_id) main_worker_id = new_worker.id;

		// log
		console.log(`Worker ${worker.process.pid} died.`);
	});
} else {
	process.on('message', (msg) => {
		if (msg.topic && msg.topic === 'start') {
			require('./app.js')(msg.value);
		}
	});
}
