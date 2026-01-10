#!/bin/bash
set -e

AMI="ami-0fc970cb875c1d4e9"
TYPE="t3.micro"
KEY_PAIR="$1"               
SG_NAME="$2"                
USER_DATA_FILE="$3"         
TAG="$4"                    

SG_ID=$(aws ec2 describe-security-groups \
          --filters Name=group-name,Values="$SG_NAME" \
          --query SecurityGroups[0].GroupId --output text)

INSTANCE_ID=$(aws ec2 run-instances \
  --image-id "$AMI" \
  --instance-type "$TYPE" \
  --key-name "$KEY_PAIR" \
  --security-group-ids "$SG_ID" \
  --user-data "file://$USER_DATA_FILE" \
  --tag-specifications "ResourceType=instance,Tags=[{Key=Name,Value=$TAG}]" \
  --query Instances[0].InstanceId --output text)

echo "Esperando a que la instancia esté en estado running..."
aws ec2 wait instance-running --instance-ids "$INSTANCE_ID"

PUBLIC_IP=$(aws ec2 describe-instances \
  --instance-ids "$INSTANCE_ID" \
  --query Reservations[0].Instances[0].PublicIpAddress --output text)

echo "INSTANCE_ID=$INSTANCE_ID" >> $GITHUB_OUTPUT
echo "PUBLIC_IP=$PUBLIC_IP"     >> $GITHUB_OUTPUT