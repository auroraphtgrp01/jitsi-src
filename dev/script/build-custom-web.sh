#!/bin/bash

set -e

echo "🚀 Building custom Jitsi Meet web image..."

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_ROOT"

# Configuration
TAG="1.0.3"
JITSI_MEET_DIR=".."
DOCKER_DIR="."
TEMP_BUILD_DIR="/tmp/jitsi-custom-build"

# Architecture selection
echo "Select build architecture:"
echo "1. linux/amd64 (Intel/AMD 64-bit)"
echo "2. linux/arm64 (ARM 64-bit)"
echo "3. Both amd64 and arm64 (multi-platform)"
echo "4. Auto-detect current system architecture"
read -p "Enter your choice (1-4): " ARCH_CHOICE

case $ARCH_CHOICE in
    1)
        PLATFORM="linux/amd64"
        echo "✅ Selected: linux/amd64"
        ;;
    2)
        PLATFORM="linux/arm64"
        echo "✅ Selected: linux/arm64"
        ;;
    3)
        PLATFORM="linux/amd64,linux/arm64"
        echo "✅ Selected: Multi-platform (amd64 + arm64)"
        ;;
    4)
        # Auto-detect system architecture
        ARCH=$(uname -m)
        case $ARCH in
            x86_64)
                PLATFORM="linux/amd64"
                echo "✅ Auto-detected: linux/amd64 (x86_64)"
                ;;
            aarch64|arm64)
                PLATFORM="linux/arm64"
                echo "✅ Auto-detected: linux/arm64 (aarch64)"
                ;;
            *)
                echo "⚠️  Unknown architecture: $ARCH. Defaulting to linux/amd64"
                PLATFORM="linux/amd64"
                ;;
        esac
        ;;
    *)
        echo "❌ Invalid choice. Defaulting to linux/amd64"
        PLATFORM="linux/amd64"
        ;;
esac

rm -rf "$TEMP_BUILD_DIR"
mkdir -p "$TEMP_BUILD_DIR"

echo "📦 Copying built assets..."
cp -r "$JITSI_MEET_DIR/libs" "$TEMP_BUILD_DIR/"
cp -r "$JITSI_MEET_DIR/css" "$TEMP_BUILD_DIR/"
cp -r "$JITSI_MEET_DIR/images" "$TEMP_BUILD_DIR/"
cp -r "$JITSI_MEET_DIR/sounds" "$TEMP_BUILD_DIR/"
cp -r "$JITSI_MEET_DIR/lang" "$TEMP_BUILD_DIR/"
cp -r "$JITSI_MEET_DIR/static" "$TEMP_BUILD_DIR/"
cp -r "$JITSI_MEET_DIR/fonts" "$TEMP_BUILD_DIR/"

# Copy HTML và JS files
cp "$JITSI_MEET_DIR"/*.html "$TEMP_BUILD_DIR/" 2>/dev/null || true
cp "$JITSI_MEET_DIR"/*.js "$TEMP_BUILD_DIR/" 2>/dev/null || true

# Copy Dockerfile
cp "$DOCKER_DIR/web/Dockerfile.custom" "$TEMP_BUILD_DIR/Dockerfile"

echo "🏗️  Building Docker image for platform(s): $PLATFORM"
cd "$TEMP_BUILD_DIR"

# Check if buildx is available and create builder if needed
if ! docker buildx ls | grep -q "jitsi-builder"; then
    echo "🔧 Creating Docker buildx builder..."
    docker buildx create --name jitsi-builder --use
else
    echo "🔧 Using existing Docker buildx builder..."
    docker buildx use jitsi-builder
fi

# Build for selected platform(s)
if [[ "$PLATFORM" == *","* ]]; then
    # Multi-platform build
    echo "🏗️  Building multi-platform image..."
    docker buildx build --platform "$PLATFORM" -t auroraphtgrp/jitsi-react:$TAG --push .
else
    # Single platform build
    echo "🏗️  Building single platform image..."
    docker buildx build --platform "$PLATFORM" -t auroraphtgrp/jitsi-react:$TAG --load .
fi

echo "✅ Custom image built successfully!"
echo "📝 Image name: auroraphtgrp/jitsi-react:$TAG"

# Only push if it's a single platform build (multi-platform already pushed)
if [[ "$PLATFORM" != *","* ]]; then
    echo "🚀 Pushing image to Docker Hub..."
    docker push auroraphtgrp/jitsi-react:$TAG
    echo "✅ Image pushed successfully!"
else
    echo "✅ Multi-platform image already pushed to Docker Hub!"
fi
echo ""
echo ""
echo "📋 Next steps:"
echo "1. Copy .env.example to .env in docker-jitsi-meet directory"
echo "2. Configure your .env file"
echo "3. Update docker-compose.yml to use auroraphtgrp/jitsi-react:$TAG"
echo "4. Run: docker-compose up -d"
echo ""
echo "ℹ️  Build info:"
echo "   - Platform(s): $PLATFORM"
echo "   - Image: auroraphtgrp/jitsi-react:$TAG"
if [[ "$PLATFORM" == *","* ]]; then
    echo "   - Multi-platform image available on Docker Hub"
else
    echo "   - Single platform image built locally and pushed to Docker Hub"
fi

# Cleanup
rm -rf "$TEMP_BUILD_DIR"
