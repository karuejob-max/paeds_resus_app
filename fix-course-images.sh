#!/bin/bash
# Download all course images from Manus CDN to local public/assets/course-images/
# Then update database content to use local paths

set -e

DEST="client/public/assets/course-images"
mkdir -p "$DEST"

echo "Downloading course images..."

download() {
  local name="$1"
  local url="$2"
  local ext="${url##*.}"
  local file="$DEST/${name}.${ext}"
  if [ -f "$file" ]; then
    echo "  SKIP $name (already exists)"
  else
    echo "  Downloading $name..."
    curl -s -L -o "$file" "$url"
    echo "  OK $name -> $file"
  fi
}

# BLS images
download "AdultBLSAlgorithmHCP"   "https://files.manuscdn.com/user_upload_by_module/session_file/310519663302160278/uPVOEVMtdNNCAFxJ.jpg"
download "AdultBLSCircular"        "https://files.manuscdn.com/user_upload_by_module/session_file/310519663302160278/JRhqhPQjUavvvnTi.jpg"
download "HeadTiltChinLift"        "https://files.manuscdn.com/user_upload_by_module/session_file/310519663302160278/dlVFAvOxSQtIQAhD.jpg"
download "SingleRescuer"           "https://files.manuscdn.com/user_upload_by_module/session_file/310519663302160278/bFYHIRnhYRSgoLLr.jpg"
download "TwoRescuer"              "https://files.manuscdn.com/user_upload_by_module/session_file/310519663302160278/OiYeNjGHMerXxnuo.jpg"
download "PadPlacement"            "https://files.manuscdn.com/user_upload_by_module/session_file/310519663302160278/zQTJdmBosnHpHqBa.jpg"
download "AdultFBAO"               "https://files.manuscdn.com/user_upload_by_module/session_file/310519663302160278/EbUetJWLdlcFLPmd.jpg"
download "BLSTermination"          "https://files.manuscdn.com/user_upload_by_module/session_file/310519663302160278/OppQyzCIqrmgrqWy.jpg"

# ACLS images
download "AdultCAAlgorithm"        "https://files.manuscdn.com/user_upload_by_module/session_file/310519663302160278/WMAFDEebhxuLTSvW.jpg"
download "AdultCACircular"         "https://files.manuscdn.com/user_upload_by_module/session_file/310519663302160278/iqTAFIaeCgYxlqIE.jpg"
download "AdultBradycardia"        "https://files.manuscdn.com/user_upload_by_module/session_file/310519663302160278/RxhFLJoAuwgNJyEN.jpg"
download "AdultTachycardia"        "https://files.manuscdn.com/user_upload_by_module/session_file/310519663302160278/siCbDpWmTQthWUzd.jpg"
download "ElectricalCardioversion" "https://files.manuscdn.com/user_upload_by_module/session_file/310519663302160278/UchZBrALpalLmnEq.webp"
download "AdvancedAirway"          "https://files.manuscdn.com/user_upload_by_module/session_file/310519663302160278/unzmuRCvlBKLAZbp.jpg"
download "ALSTermination"          "https://files.manuscdn.com/user_upload_by_module/session_file/310519663302160278/qbHRuEaQatfuaYHh.jpg"

echo ""
echo "Downloaded files:"
ls -lh "$DEST"
echo ""
echo "Done. Now run: npx tsx fix-course-image-urls.ts"
