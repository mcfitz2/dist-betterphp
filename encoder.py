from subprocess import Popen, PIPE
import os
import re
import json
def mkprogress(prefix):
    def progress(percent):
        msg = "Done!\n" if percent == 100 else "%d%%" % percent
        sys.stdout.write("\r%s%s" % (prefix, msg))
        sys.stdout.flush()
    return progress

class Lame:
    def __init__(self, config):
        self.infile = config["fullpath"]
        self.outfile = config["newpath"]
        self.args = config["lameopts"]
        
    def run(self, callback):
        fcommand = ["flac", "-dc"]+[self.infile]
        lcommand = ["lame"]+self.args

        if self.outfile:
            if not os.path.exists(self.outfile):
                try:
                    os.makedirs(os.path.dirname(self.outfile))
                except OSError:
                    pass
 
        p1 = Popen(fcommand, stderr=PIPE)
        p2 = Popen(lcommand, stdin=p1.stdout, stderr=PIPE)
        p1.stdout.close()
        while True:
            line = p2.stderr.readline()
            if not line:
                break
            m = re.match(r".+\s+\(\s*(\d+)\%\)\|.+", line)
            if m:
                callback(int(m.group(1)))
        return self.outfile

if __name__ == "__main__":
    config = json.load(open("0.json", 'r'))
    lame = Lame(config)
    lame.run(mkprogress("Encoding"))
