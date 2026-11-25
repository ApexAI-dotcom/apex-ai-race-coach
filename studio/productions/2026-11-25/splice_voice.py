# Remplace « Il coûtait à chaque tour. » (15,44 s à 16,76 s de la prise d'origine) par la phrase
# corrigée, régénérée seule avec la même voix (Sid, eleven_v4). Décalage de la suite : +0,42 s.
import os, subprocess
os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)), "../../../apex-promo-video/apexai-video/public/voice"))
f = ("[0:a]atrim=0:15.44,asetpts=PTS-STARTPTS,afade=t=out:st=15.42:d=0.02[a];"
     "[1:a]atrim=0:1.74,asetpts=PTS-STARTPTS,volume=-1.5dB,afade=t=in:d=0.008,afade=t=out:st=1.70:d=0.04[b];"
     "[0:a]atrim=16.76,asetpts=PTS-STARTPTS,afade=t=in:d=0.02[c];[a][b][c]concat=n=3:v=0:a=1[o]")
subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", "2026-11-25-reel-une-seule-fois.mp3", "-i", "2026-11-25-phrase-virage7.mp3",
                "-filter_complex", f, "-map", "[o]", "-b:a", "192k", "2026-11-25-reel-une-seule-fois-v2.mp3"], check=True)
