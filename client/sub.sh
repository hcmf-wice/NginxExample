PORT=$1
CLIENT=$2
TOPIC=$3
mosquitto_sub -V 311 -v -d -h localhost -p ${PORT} -i ${CLIENT} -t ${TOPIC}