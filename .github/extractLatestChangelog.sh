source_file=$1

# Get diff with line numbers and extract only consecutive changes from the top
diff -u <( git show HEAD~1:"$source_file" ) "$source_file" | \
  awk '
    /^@@/ { in_hunk = 1; next }
    in_hunk && /^-/ { next }
    in_hunk && /^+/ {
      line = substr($0, 2)
      if (!first_line_processed) {
        first_line_processed = 1
        if (line ~ /^#/) next
      }
      print line
      changed = 1
      next
    }
    in_hunk && /^ / && changed { exit }
    in_hunk && /^ / { next }
  ' | awk 'NF {p=1} p && !/^[[:space:]]*$/ {for(i=1;i<=n;i++) print b[i]; n=0; print} p && /^[[:space:]]*$/ {b[++n]=$0} END {if(p) for(i=1;i<=n && b[i]~/^[[:space:]]*$/;i++); for(;i<=n;i++) if(b[i]!~/^[[:space:]]*$/) {for(j=i;j<=n;j++) print b[j]; break}}' > RELEASE_CHANGELOG.md || true

echo "Success"
exit 0;
