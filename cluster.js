const cluster = require('cluster')
const cCPUs = require('os').cpus().length

if (cluster.isMaster) {
    let main_worker_id = 1
    let last_worker_id = 0

    // Create a worker for each CPU
    for (let i = 0; i < cCPUs; i++) {
        cluster.fork()
    }

    cluster.on('online', function (worker) {
        // Send start message to all workers and update last_worker_id. This is called from a worker's main thread
        worker.send({ topic: 'start', value: worker.id === main_worker_id })
        last_worker_id = worker.id

        // log
        console.log(`Worker ${worker.process.pid} is online.`)
    })

    cluster.on('exit', function (worker, code, signal) {
        // Fork and report died. This is called by a worker that dies before the worker is removed
        if (worker.id === main_worker_id)
            main_worker_id = last_worker_id + 1

        cluster.fork()

        console.log(`Worker ${worker.process.pid} died.`)
    })

} else {
    process.on('message', (msg) => {
        if (msg.topic && msg.topic === 'start') {
            require('./app.js')(msg.value)
        }
    })
}