FROM pierrezemb/gostatic
COPY . /srv/http/
CMD ["-port","5000","-https-promote", "-enable-logging"]
