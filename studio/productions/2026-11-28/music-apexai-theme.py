import numpy as np, wave, sys
sr=44100; dur=float(sys.argv[1]); bpm=122; out=sys.argv[2]
n=int(sr*dur); t=np.arange(n)/sr
beat=60/bpm; rng=np.random.default_rng(7)
def env(x,a,d): return np.where(x<a, x/a, np.exp(-(x-a)/d))
mix=np.zeros(n)
# drone pad: A minor-ish, slow filter swell, detuned saws approximated by summed harmonics
for f,g in [(55,0.5),(110,0.35),(164.8,0.18),(220,0.12),(261.6,0.08)]:
    for det in (-0.6,0.6):
        ph=2*np.pi*(f+det)*t
        s=sum(np.sin(k*ph)/k for k in range(1,6))
        mix+=g*0.25*s
mix*= 0.55+0.45*np.sin(2*np.pi*t/(beat*16))**2
# pulsing bass 8th notes
pos=(t % (beat/2))
bassf=np.where((t//(beat*8))%2==0,55,49)
mix+=0.35*np.sin(2*np.pi*bassf*t)*env(pos,0.005,0.09)
# soft kick on beats
kp=t % beat
kick=np.sin(2*np.pi*(45+90*np.exp(-kp*30))*kp)*env(kp,0.002,0.12)
mix+=0.45*kick
# hats offbeat (filtered noise)
noise=rng.standard_normal(n); hn=np.diff(noise,prepend=0)
hp=(t+beat/2)%beat
mix+=0.06*hn*env(hp,0.001,0.03)
# ticking 16th percussion, very low
tp=t%(beat/4)
mix+=0.025*hn*env(tp,0.001,0.01)
# fade in 0.4s (no click), fade out 1.5s
fade=np.minimum(1, t/0.4)*np.minimum(1,(dur-t)/1.5)
mix*=fade
mix=mix/np.max(np.abs(mix))*0.8
st=np.stack([mix, np.roll(mix,120)],1)
d=(st*32767).astype(np.int16)
w=wave.open(out,'wb');w.setnchannels(2);w.setsampwidth(2);w.setframerate(sr);w.writeframes(d.tobytes());w.close()
