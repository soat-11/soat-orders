#!/bin/bash

echo "########### Iniciando configuracao automatica SQS ###########"

# Regiao padrao
export AWS_DEFAULT_REGION=us-east-1

# 1. Criar a DLQ (Dead Letter Queue)
awslocal sqs create-queue --queue-name order-created-dlq

# 2. Criar a Fila Principal ligada na DLQ
# Nota: Como estamos DENTRO do container, as aspas sao menos problematicas,
# mas mantemos o padrao solido.
awslocal sqs create-queue --queue-name order-created \
  --attributes '{"RedrivePolicy": "{\"deadLetterTargetArn\":\"arn:aws:sqs:us-east-1:000000000000:order-created-dlq\",\"maxReceiveCount\":\"3\"}", "VisibilityTimeout": "30"}'

# 3. Filas de Producao
awslocal sqs create-queue --queue-name production-started
awslocal sqs create-queue --queue-name production-ready

echo "########### Filas SQS criadas com sucesso ###########"
awslocal sqs list-queues