PGW_DIR = $(dir $(abspath $(lastword $(MAKEFILE_LIST))))
PGW_EXE = $(PGW_DIR)/bin/gw
PGW_PIPY_EXE = $(PGW_DIR)/pipy/bin/pipy
PGW_INSTALL = /usr/local/bin/gw

ifneq (,$(shell command -v cmake3))
	CMAKE = cmake3
else
	CMAKE = cmake
endif

.PHONY: all install

all: $(PGW_EXE)

$(PGW_EXE): $(PWG_PIPY_EXE)
	mkdir -p bin
	mkdir -p build
	cd build && $(CMAKE) ../pipy \
		-DCMAKE_BUILD_TYPE=Release \
		-DCMAKE_C_COMPILER=clang \
		-DCMAKE_CXX_COMPILER=clang++ \
		-DPIPY_GUI=OFF \
		-DPIPY_SAMPLE_CODEBASES=OFF \
		-DPIPY_CUSTOM_CODEBASES=pgw/proxy:../src \
		-DPIPY_DEFAULT_OPTIONS="repo://pgw/proxy --args" \
		-DPIPY_SOIL_FREED_SPACE=OFF \
		-DPIPY_ASSERT_SAME_THREAD=OFF \
		-DPIPY_LTO=OFF \
	&& $(MAKE)
	cp $(PGW_PIPY_EXE) $(PGW_EXE)

install: $(PGW_INSTALL)

$(PGW_INSTALL): $(PGW_EXE)
	rm -f $(PGW_INSTALL)
	cp -f $(PGW_EXE) $(PGW_INSTALL)
	chmod a+x $(PGW_INSTALL)
