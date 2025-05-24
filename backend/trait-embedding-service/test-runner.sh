#!/bin/bash

# Colors for better output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}MosaicMatch Trait & Embedding Service Tests${NC}"
echo "============================================="
echo ""

# Function to run a specific test with proper logging
run_test() {
  local test_name=$1
  local test_path=$2
  
  echo -e "${YELLOW}Running ${test_name} tests...${NC}"
  npx jest --testPathPattern="${test_path}" --verbose
  
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ ${test_name} tests passed!${NC}"
  else
    echo -e "${RED}✗ ${test_name} tests failed!${NC}"
    exit 1
  fi
  
  echo ""
}

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
  echo -e "${YELLOW}Installing dependencies...${NC}"
  npm install
  echo ""
fi

# Run tests based on arguments
if [ "$1" == "all" ]; then
  # Run all tests
  run_test "Token Bucket" "token-bucket.test.ts"
  run_test "Auth Middleware" "auth-middleware.test.ts"
  run_test "Pinecone Integration" "pinecone-integration.test.ts"
elif [ "$1" == "local" ]; then
  # Run only local tests (no external API calls)
  run_test "Token Bucket" "token-bucket.test.ts"
  run_test "Auth Middleware" "auth-middleware.test.ts"
elif [ "$1" == "pinecone" ]; then
  # Run only pinecone tests
  run_test "Pinecone Integration" "pinecone-integration.test.ts"
else
  # Default: run local tests only
  echo -e "${YELLOW}Running local tests only (no external API calls)${NC}"
  echo "For all tests: ./test-runner.sh all"
  echo "For Pinecone tests only: ./test-runner.sh pinecone"
  echo ""
  
  run_test "Token Bucket" "token-bucket.test.ts"
  run_test "Auth Middleware" "auth-middleware.test.ts"
fi

echo -e "${GREEN}All tests completed!${NC}"