# rover
Notify users of discounted Steam Store items on their custom watch list (via Discord)

## Install

### Non-Docker
Make sure you have MongoDB and Node.js installed. Then:

```
git clone https://github.com/antigravities/rover.git
cd rover
npm i
cp .env.example .env
$EDITOR .env
npm start
```

### Docker
We publish a Docker image at `antigravities/rover`. A sample docker-compose
file is listed here:

```yaml
version: '3'

services:
  app:
    image: antigravities/rover:latest
    restart: always
    environment:
      MONGO_URL: mongodb://db:27017/
      MONGO_DB: rover
      DISCORD_TOKEN: ...
    depends_on:
      - db

  db:
    image: mongo:latest
    restart: always
    expose:
      - "27017"
    volumes:
      - /app/rover/data/mongodb:/data/db
```

## License

Copyright (C) 2021 Alexandra Frock

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, version 3 only.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program.  If not, see <https://www.gnu.org/licenses/>.