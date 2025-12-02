#!/bin/bash

###########################################
# PDF Editor Pro - Test Execution Script
###########################################
#
# This script runs all tests for the PDF Editor Pro Python API.
#
# Usage:
#   ./run_tests.sh              # Run all tests
#   ./run_tests.sh unit         # Run only unit tests
#   ./run_tests.sh integration  # Run only integration tests
#   ./run_tests.sh ocr          # Run only OCR tests
#   ./run_tests.sh performance  # Run only performance tests
#   ./run_tests.sh fast         # Run tests excluding slow ones
#   ./run_tests.sh coverage     # Run with coverage report
#

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Project root directory
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_ROOT"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  PDF Editor Pro - Test Suite${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo -e "${YELLOW}Virtual environment not found. Creating...${NC}"
    python3 -m venv venv
fi

# Activate virtual environment
echo -e "${BLUE}Activating virtual environment...${NC}"
source venv/bin/activate

# Install/update dependencies
echo -e "${BLUE}Installing dependencies...${NC}"
pip install -q --upgrade pip
pip install -q -r api/requirements.txt

# Ensure test fixtures directory exists
mkdir -p tests/fixtures

# Set Python path to include api directory
export PYTHONPATH="${PROJECT_ROOT}/api:${PROJECT_ROOT}:${PYTHONPATH}"

# Default test command
TEST_CMD="pytest tests/ -v"

# Parse command line arguments
case "${1:-all}" in
    unit)
        echo -e "${GREEN}Running unit tests...${NC}"
        TEST_CMD="pytest tests/ -v -m unit"
        ;;
    integration)
        echo -e "${GREEN}Running integration tests...${NC}"
        TEST_CMD="pytest tests/ -v -m integration"
        ;;
    ocr)
        echo -e "${GREEN}Running OCR tests...${NC}"
        TEST_CMD="pytest tests/ -v -m ocr"
        ;;
    performance)
        echo -e "${GREEN}Running performance tests...${NC}"
        TEST_CMD="pytest tests/ -v -m performance"
        ;;
    fast)
        echo -e "${GREEN}Running fast tests (excluding slow)...${NC}"
        TEST_CMD="pytest tests/ -v -m 'not slow'"
        ;;
    coverage)
        echo -e "${GREEN}Running tests with coverage...${NC}"
        TEST_CMD="pytest tests/ -v --cov=api --cov-report=html --cov-report=term"
        ;;
    help)
        echo "Usage: ./run_tests.sh [option]"
        echo ""
        echo "Options:"
        echo "  all          Run all tests (default)"
        echo "  unit         Run only unit tests"
        echo "  integration  Run only integration tests"
        echo "  ocr          Run only OCR tests"
        echo "  performance  Run only performance tests"
        echo "  fast         Run tests excluding slow ones"
        echo "  coverage     Run with coverage report"
        echo "  help         Show this help message"
        exit 0
        ;;
    all|*)
        echo -e "${GREEN}Running all tests...${NC}"
        TEST_CMD="pytest tests/ -v"
        ;;
esac

echo ""
echo -e "${BLUE}Test Command: ${TEST_CMD}${NC}"
echo ""

# Run tests
if $TEST_CMD; then
    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}  ✓ All tests passed!${NC}"
    echo -e "${GREEN}========================================${NC}"
    exit 0
else
    echo ""
    echo -e "${RED}========================================${NC}"
    echo -e "${RED}  ✗ Tests failed!${NC}"
    echo -e "${RED}========================================${NC}"
    exit 1
fi
