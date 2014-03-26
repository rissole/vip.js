git checkout master
wget -q -O roster.xml http://vip.aersia.net/roster.xml && ./wellform.sh roster.xml
CHANGED=$(git diff roster.xml)
if [ -n "$CHANGED" ]; then
    git add roster.xml && git commit -m "update roster.xml"
    git checkout gh-pages && git merge master
    git push origin --all
    git checkout master
fi
