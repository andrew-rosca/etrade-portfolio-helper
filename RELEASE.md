# Release Process

This project uses GitHub Actions to automatically build and publish releases.

## Creating a New Release

### 1. Update Version

Edit `version.txt` with the new version number:
```bash
echo "1.1.0" > version.txt
```

### 2. Commit Changes

```bash
git add version.txt
git commit -m "Bump version to 1.1.0"
git push origin main
```

### 3. Create and Push Tag

```bash
git tag v1.1.0
git push origin v1.1.0
```

### 4. Automatic Build

GitHub Actions will automatically:
- Build the distribution package
- Create a GitHub release
- Upload the ZIP file as a release asset

## Version Numbering

Follow semantic versioning (MAJOR.MINOR.PATCH):
- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes

Examples:
- `1.0.0` - Initial release
- `1.1.0` - New feature added
- `1.1.1` - Bug fix
- `2.0.0` - Breaking change

## Manual Build (Testing)

To test the build process locally:

```bash
./create-distribution.sh
```

This creates `dist/etrade-portfolio-helper-vX.Y.Z.zip` for manual distribution.

## Production Workflow

1. Develop and test changes locally
2. Update `version.txt` with new version
3. Commit and push changes to main branch
4. Create and push version tag (triggers release)
5. GitHub Actions builds and publishes release
6. Users download from Releases page
