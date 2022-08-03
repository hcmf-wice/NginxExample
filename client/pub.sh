PORT=$1
CLIENT=$2
TOPIC=$3
MSG=$4
mosquitto_pub -V 311 -d -h localhost -p ${PORT} -i ${CLIENT} -t ${TOPIC} -m "${MSG}"
