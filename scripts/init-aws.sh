#!/bin/bash
echo "########### Criando filas SQS locais ###########"

# 1. Fila que o ORDER SERVICE publica para os outros
awslocal sqs create-queue --queue-name order-created-queue

# 2. Fila que o ORDER SERVICE consome do PRODUCTION SERVICE
awslocal sqs create-queue --queue-name production-updates-queue

# 3. Fila que o ORDER SERVICE consome do PAYMENT SERVICE
awslocal sqs create-queue --queue-name payment-updates-queue

echo "########### Filas criadas com sucesso ###########"