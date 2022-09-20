
FROM node:18-alpine AS builder
# Add a work directory
WORKDIR /100ms-web

# Copy app files
COPY . .

RUN yarn install

ENV NODE_ENV production

# Build the app
RUN yarn build

# Bundle static assets with nginx
FROM nginx:1.23.1-alpine as production
# Copy built assets from builder
COPY --from=builder /100ms-web/build /usr/share/nginx/html

# set environment variables.
# These are the bare minimum needed for running
# the app. Feel free to add more as per your needs.
ENV REACT_APP_TILE_SHAPE=1-1
ENV REACT_APP_THEME=dark
ENV REACT_APP_SHOW_CHAT='true'
ENV REACT_APP_SHOW_SCREENSHARE='true'
ENV REACT_APP_ENABLE_STATS_FOR_NERDS='true'
ENV REACT_APP_VIDEO_AVATAR='true'
ENV REACT_APP_ENABLE_HLS_QUALITY_LVL='true'
ENV REACT_APP_TOKEN_GENERATION_ENDPOINT='https://prod-in2.100ms.live/hmsapi/raam.app.100ms.live/'
ENV REACT_APP_ENV=prod
ENV REACT_APP_HEADLESS_JOIN='false'

# Add your nginx.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf
# Expose port
EXPOSE 80
# Start nginx
CMD ["nginx", "-g", "daemon off;"]

