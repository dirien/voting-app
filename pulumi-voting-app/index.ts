import * as k8s from "@pulumi/kubernetes";
import * as pulumi from "@pulumi/pulumi";


const config = new pulumi.Config();
const labels = config.require("LABELS");

const dbDeployment = new k8s.apps.v1.Deployment("db", {
    metadata: {
        labels: pulumi.jsonParse(labels),
    },
    spec: {
        replicas: config.requireNumber("POSTGRES_REPLICA"),
        selector: {
            matchLabels: pulumi.jsonParse(labels),
        },
        template: {
            metadata: {
                labels: pulumi.jsonParse(labels),
            },
            spec: {
                containers: [
                    {
                        name: "postgres",
                        image: config.require("POSTGRES_IMAGE"),
                        env: [
                            {
                                name: "POSTGRES_USER",
                                value: config.require("POSTGRES_USER")
                            },
                            {
                                name: "POSTGRES_PASSWORD",
                                value: config.requireSecret("POSTGRES_PASSWORD")
                            },
                        ],
                        ports: [
                            {
                                containerPort: config.requireNumber("POSTGRES_PORT"),
                                name: "postgres"
                            },
                        ],
                        volumeMounts: [
                            {
                                mountPath: "/var/lib/postgresql/data",
                                name: "db-data"
                            },
                        ],
                    },
                ],
                volumes: [
                    {
                        name: "db-data",
                        emptyDir: {},
                    },
                ],
            },
        },
    },
});

const dbService = new k8s.core.v1.Service("db", {
    metadata: {
        labels: pulumi.jsonParse(labels),
        name: "db",
    },
    spec: {
        type: "ClusterIP",
        ports: [
            {
                name: "db-service",
                port: 5432,
                targetPort: 5432,
            },
        ],
        selector: pulumi.jsonParse(labels),
    },
});


const redisLabels = {app: "redis"};

const redisDeployment = new k8s.apps.v1.Deployment("redis", {
    metadata: {
        labels: redisLabels,
        name: "redis",
    },
    spec: {
        replicas: 1,
        selector: {matchLabels: redisLabels},
        template: {
            metadata: {labels: redisLabels},
            spec: {
                containers: [
                    {
                        name: "redis",
                        image: "redis:alpine",
                        ports: [{containerPort: 6379, name: "redis"}],
                        volumeMounts: [{mountPath: "/data", name: "redis-data"}],
                    },
                ],
                volumes: [
                    {
                        name: "redis-data",
                        emptyDir: {},
                    },
                ],
            },
        },
    },
});

const redisService = new k8s.core.v1.Service("redis", {
    metadata: {
        labels: redisLabels,
        name: "redis",
    },
    spec: {
        type: "ClusterIP",
        ports: [
            {
                name: "redis-service",
                port: 6379,
                targetPort: 6379,
            },
        ],
        selector: redisLabels,
    },
});

const resultAppLabels = {app: "result"};
const voteAppLabels = {app: "vote"};
const workerAppLabels = {app: "worker"};

const resultDeployment = new k8s.apps.v1.Deployment("result", {
    metadata: {
        labels: resultAppLabels,
        name: "result",
    },
    spec: {
        replicas: 1,
        selector: {matchLabels: resultAppLabels},
        template: {
            metadata: {labels: resultAppLabels},
            spec: {
                containers: [
                    {
                        name: "result",
                        image: "dockersamples/examplevotingapp_result",
                        ports: [{containerPort: 80, name: "result"}],
                    },
                ],
            },
        },
    },
});

const resultService = new k8s.core.v1.Service("result", {
    metadata: {
        labels: resultAppLabels,
        name: "result",
    },
    spec: {
        type: "NodePort",
        ports: [
            {
                name: "result-service",
                port: 5001,
                targetPort: 80,
                nodePort: 31001,
            },
        ],
        selector: resultAppLabels,
    },
});

const voteDeployment = new k8s.apps.v1.Deployment("vote", {
    metadata: {
        labels: voteAppLabels,
        name: "vote",
    },
    spec: {
        replicas: 1,
        selector: {matchLabels: voteAppLabels},
        template: {
            metadata: {labels: voteAppLabels},
            spec: {
                containers: [
                    {
                        name: "vote",
                        image: "dockersamples/examplevotingapp_vote",
                        ports: [{containerPort: 80, name: "vote"}],
                    },
                ],
            },
        },
    },
});

const voteService = new k8s.core.v1.Service("vote", {
    metadata: {
        labels: voteAppLabels,
        name: "vote",
    },
    spec: {
        type: "NodePort",
        ports: [
            {
                name: "vote-service",
                port: 5000,
                targetPort: 80,
                nodePort: 31002,
            },
        ],
        selector: voteAppLabels,
    },
});

const workerDeployment = new k8s.apps.v1.Deployment("worker", {
    metadata: {
        labels: workerAppLabels,
        name: "worker",
    },
    spec: {
        replicas: 1,
        selector: {matchLabels: workerAppLabels},
        template: {
            metadata: {labels: workerAppLabels},
            spec: {
                containers: [
                    {
                        name: "worker",
                        image: "dockersamples/examplevotingapp_worker",
                    },
                ],
            },
        },
    },
});
