#!/usr/bin/env bash

set -e

if ! which docker 2>&1 > /dev/null; then
    echo "Please install 'docker' first"
    exit 1
fi

if ! which docker-compose 2>&1 > /dev/null; then
    echo "Please install 'docker-compose' first"
    exit 1
fi

if ! which jq 2>&1 > /dev/null; then
    echo "Please install 'jq' first"
    exit 1
fi

# Create the qaci-node container
docker-compose up --no-start qaci-node

# Start qaci-node so we can inspect it
docker-compose start qaci-node

# Identify the container ID
CONTAINER_ID=$(docker container ls | grep qaci-node | cut -d' ' -f1)

# Inspect the container to identify the host IP address
HOST_IP=$(docker inspect "$CONTAINER_ID" | jq -r .[0].NetworkSettings.Networks[].Gateway)

echo "Host IP: $HOST_IP"

# Inject the host IP into docker-compose.yml and server/admin.sh
sed -i -e "s/host.docker.internal/$HOST_IP/g" docker-compose.yml
sed -i -e "s/host.docker.internal/$HOST_IP/g" ../server/admin.sh
sed -i -e "s/host.docker.internal/$HOST_IP/g" ../server/admin_v0_10.sh

function stop_graph_node {
    # Ensure qaci-node is stopped
    docker-compose stop qaci-node
}

trap stop_graph_node EXIT
