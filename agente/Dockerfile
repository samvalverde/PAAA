# vim:set ft=dockerfile:
  FROM ubuntu:20.04

  ENV DEBIAN_FRONTEND=noninteractive 
  # Set the application name
  ENV APPLICATION rethinkdb-compilation-env
  
  # explicitly set user/group IDs
  RUN useradd -ms /bin/bash jedi
  RUN chown -R jedi:jedi /home/jedi/
  
  #
  # Install some packages
  #
  USER root
  RUN apt-get update
  
  # A few utility for debugging purposes
  RUN apt-get install -y \
    nano \
    lsof \
    net-tools \
    inetutils-ping \
    tmux \
    vim \
    curl \
    file \
    git \
    build-essential \
    gcc \
    python \
    python-dev \
    less \
    sudo \
    bc
  
  # RethinkDB dependencies
  RUN apt-get install -y \
    make \
    debhelper \
    ccache \
    m4 \
    g++ \
    --no-install-recommends
  
  # V8 dependencies
  RUN dpkg --add-architecture i386
  RUN apt-get update
  RUN apt-get install -y \
  # https://bugs.chromium.org/p/chromium/issues/detail?id=289
  # The instructions above do not work on ubuntu 16.04 anymore. This below is an adaptation.
    g++-multilib zlib1g-dev zlib1g-dev:i386
  
  
  # Replace shell with bash so we can source files
  RUN rm /bin/sh && ln -s /bin/bash /bin/sh
  
  USER jedi
  
  # rethinkdb can't compile node-0.12.2 on ARM apparently so installing it with nvm
  ENV NODE_VERSION 0.12.2
  RUN curl -L https://git.io/n-install | bash -s - -y $NODE_VERSION
  ENV PATH=$PATH:/home/jedi/n/bin
  
  #
  # RPi tool chain
  #
  # Preparing the cross-compilation environment
  RUN cd /home/jedi && \
    git clone https://github.com/raspberrypi/tools.git rpi-toolchain && \
    cd rpi-toolchain && \
    git checkout b65595ffb74e5853ba61916f49bdbccfc54f1300 && \
    echo "export PI_TOOLS_HOME=$HOME/rpi-toolchain" >> ~/.bashrc
  ENV PI_TOOLS_HOME /home/jedi/rpi-toolchain/
  # Retrieve the CMake toolchain configuration file. Do we need that???
  ADD https://raw.githubusercontent.com/jdmichaud/domos/master/rpi/cmaketc/Toolchain-raspberrypi-arm.cmake /home/jedi/Toolchain-raspberrypi-arm.cmake
  # Setup the environment for cross-compiling
  ENV CROSS=/home/jedi/rpi-toolchain/arm-bcm2708/gcc-linaro-arm-linux-gnueabihf-raspbian-x64/bin/arm-linux-gnueabihf
  ENV CC=$CROSS-gcc
  ENV CXX=$CROSS-g++
  ENV LD=$CROSS-ld
  ENV AR=$CROSS-ar
  ENV RANLIB=$CROSS-ranlib
  
  #
  # Download, compile and package rethinkdb
  #
  RUN cd /home/jedi && \
    # To have node in the PATH
    /bin/bash -c "source ~/.bashrc" && \
    # Download rethinkdb and conpile it
    curl -L https://github.com/rethinkdb/rethinkdb/archive/v2.3.6.tar.gz -o rethinkdb-2.3.6.tar.gz && \
    tar zxf rethinkdb-2.3.6.tar.gz && \
    cd rethinkdb-2.3.6 && \
    # From rethinkdb build instructions
    rm -rf external/v8* && \
    # deb_buildpackage complains that dependencies are missing. There is no dependency...
    sed -i 's/rfakeroot $(DEBUILD_SIGN_OPTIONS)/rfakeroot $(DEBUILD_SIGN_OPTIONS) -d -j2/g' mk/packaging.mk && \
    # Here, adding allow-catch to ./configure but also forcing building ssl as described
    # in this issue: https://github.com/rethinkdb/rethinkdb/issues/5776#issuecomment-220168597
    sed -i 's@./configure@./configure --allow-fetch --ccache\n\tmake build-openssl@g' packaging/debian/rules && \
    # https://github.com/rethinkdb/rethinkdb/issues/3312
    sed -i 's@$build_dir/third_party/icu" ./configure@$build_dir/third_party/icu/source" ./configure@g' mk/support/pkg/v8.sh && \
    # v8 won't compile if we don't disable the layout...
    sed -i 's/--enable-static "$@"/--enable-static --disable-layout "$@"/g' mk/support/pkg/v8.sh && \
    # Fix broken link
    sed -i 's/http:\/\/www.canonware.com\/download\/jemalloc/https:\/\/github.com\/jemalloc\/jemalloc\/releases\/download\/\$version/' mk/support/pkg/jemalloc.sh && \
    # Add a space to separate options
    sed -i 's@configure_flags+="--host=$($CXX -dumpmachine)"@ configure_flags+=" --host=$($CXX -dumpmachine)"@g' mk/support/pkg/jemalloc.sh && \
    # Fix some script bug
    sed -i 's@"${configure_flags:-}"@${configure_flags:-}@g' mk/support/pkg/jemalloc.sh && \
    sed -i -e 's@1\.2\.8@1.2.11@' -e 's@a4d316c404ff54ca545ea71a27af7dbc29817088@e6d119755acdf9104d7ba236b1242696940ed6dd@' mk/support/pkg/zlib.sh && \
    # Force Architecture in debian package control file
    sed -i 's/Architecture: i386 amd64/Architecture: armhf/g' packaging/debian/control.in && \
    # Point dh_shlibdeps to the raspberry compilation tool-chain shared libraries
    sed -i 's@dh_shlibdeps -a@dh_shlibdeps -a -l/home/jedi/rpi-toolchain/arm-bcm2708/gcc-linaro-arm-linux-gnueabihf-raspbian-x64/arm-linux-gnueabihf/libc/lib/arm-linux-gnueabihf/:/home/jedi/rpi-toolchain/arm-bcm2708/gcc-linaro-arm-linux-gnueabihf-raspbian-x64/arm-linux-gnueabihf/lib/ --dpkg-shlibdeps-params=--ignore-missing-info@g' packaging/debian/rules && \
    # Add path to cross-compiling executable for dh_strip which has some trouble finding them...
    # Then, reset PATH just in case
    sed -ri 's@binary-arch: install@binary-arch: export PATH:=/home/jedi/rpi-toolchain/arm-bcm2708/gcc-linaro-arm-linux-gnueabihf-raspbian-x64/bin/:$(PATH)\nbinary-arch: install@g' packaging/debian/rules && \
    # Accelerate package compilation, especially v8's
    #sed -i 's/make "$@"/make -j`echo $(nproc) - 1 | bc` "$@"/g' mk/support/pkg/pkg.sh && \
    ./configure --allow-fetch --ccache && \
    make build-openssl -j1 && \
    # Got to build openssl manually to have the header (sys/ssl.h) in the proper place
    DEBIAN_RELEASE=jessie SIGN_PACKAGE=0 make build-deb -j1
    #UBUNTU_RELEASE=trusty SIGN_PACKAGE=0 make build-deb -d -j`echo $(nproc) - 1 | bc` SHELL="/bin/bash -x" > ../make.log 2>&1
  
  USER root
  
  