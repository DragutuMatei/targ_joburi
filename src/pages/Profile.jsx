import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getDownloadURL, getStorage, ref, uploadBytes } from "firebase/storage";
import { useAuthState } from "react-firebase-hooks/auth";
import { Html5QrcodeScanner } from "html5-qrcode";
import QRCode from "qrcode";
import Fire from "../utils/Fire";
import "../assets/scss/profile.scss";
import { saveAs } from "file-saver";
import axios from "axios";
import fileDownload from "js-file-download";

const fire = new Fire();
function Profile() {
  const navigate = useNavigate();
  const [user, loading, error] = useAuthState(fire.getUser());
  const [main, setUser] = useState(null);
  const [myStand, setMyStand] = useState();
  const [loadingState, setLoading] = useState(true);

  const [modi, setModi] = useState(false);
  const [loadingUpdate, setLoadingUpdate] = useState(false);

  const [final, setFinal] = useState(false);

  useEffect(() => {
    if (!user && !loading) {
      navigate("/");
    }
    const aa = async () => {
      if (user) {
        await fire
          .getUserByEmail2("/targ_users", user.email)
          .then(async (res) => {
            console.log("res: ", res);
            console.log("ress: ", Object.keys(res)[0]);
            setUser({ ...Object.values(res)[0], id: Object.keys(res)[0] });

            if (Object.values(res)[0].qr) setR(Object.values(res)[0].qr);
            if (Object.values(res)[0].rol === "company") {
              console.log(Object.values(res)[0].final);
              if (Object.values(res)[0].final) {
                setFinal(true);
              }
              await fire.getData("/stands").then((ress) => {
                // setOcc(res.map((oc) => oc.stand));
                if (ress && ress != null) {
                  setOcc(
                    Object.values(ress).map((oc) => {
                      if (oc.email == Object.values(res)[0].email) {
                        setMyStand(oc.index);
                      }
                      return oc.index;
                    })
                  );
                }
                setLoading(false);
              });
            } else {
              if (typeof Object.values(res)[0].about != "undefined")
                setIsUpdated(true);
              setLoading(false);
            }
          });
      }
    };
    aa();
  }, [, user, loading]);
  const [suuc, setSuuc] = useState("");

  useEffect(() => {
    console.log(final);
    console.log(!loadingState && user && main && main.rol == "company");
    if (!loadingState && user && main && main.rol == "company" && final) {
      const scanner = new Html5QrcodeScanner("reader", {
        qrbox: {
          height: 250,
          width: 250,
        },
        fps: 10,
      });
      const suc = async (rez) => {
        scanner.pause(true);

        await fire
          .addCVToDocument(`/targ_users/${main.id}`, {
            cv: rez,
          })
          .then((res) => {
            console.log("res", res);
            if (res) {
              setSuuc("CV prelut cu succes!");
            } else {
              setSuuc("Eroare de citire a codului QR!");
            }
            const timeoutId = setTimeout(() => {
              scanner.resume();
              setSuuc("");
            }, 2000);

            // Cleanup function to clear the timeout if the component unmounts
            return () => clearTimeout(timeoutId);
            // scanner.pause(true);
            // scanner.clear();
          });
        // await fire.updateData(`/targ_users/${main.id}`, {})
        // alert(rez);
      };
      const er = (err) => {
        // alert(err);
      };
      scanner.render(suc, er);
    }
  }, [, main, loadingState, final]);
  const [file, setFile] = useState();
  const [link, setLink] = useState("");
  const upload = async () => {
    if (file) {
      const storage = getStorage();

      const storageRef = ref(storage, `cv/${file.name}`);

      try {
        await uploadBytes(storageRef, file);
        const url = await getDownloadURL(storageRef);
        console.log(url);
        setLink(url);
        QRCode.toDataURL(url).then(async (res) => {
          setR(res);
          await fire
            .updateData(`/targ_users/${main.id}`, { cv: url, qr: res })
            .then((res) => {
              console.log(res);
            });
        });
      } catch (error) {
        alert(error);
      }
    } else {
      console.log("plm");
    }
  };
  const [r, setR] = useState("");

  const [occ, setOcc] = useState([]);

  const save = async (i, email) => {
    if (occ.includes(i)) return;
    setErr("");
    await fire.addData("/stands", { index: i, email }).then((res) => {
      setOcc((old) => [...old, i]);
      setMyStand(i);
    });
  };
  const uita_stand = async (i) => {
    await fire
      .deleteDocumentByfield("/stands", "email", main.email)
      .then((res) => {
        setOcc((old) => old.filter((nr) => nr != i));
        setMyStand();
        setErr("Trebuie sa alegi un stand!");
      });
  };

  useEffect(() => {
    console.log("main: ", main);
    if (main && Object.hasOwn(main, "about")) {
      console.log("mmmmm");
      setNume(main.about.nume);
      setFacultate(main.about.facultate);
      setSpec(main.about.specializare);
      setAn(main.about.an);
    }
  }, [, main]);

  const [isUpdated, setIsUpdated] = useState(false);
  const [nume, setNume] = useState(
    main && Object.hasOwn(main, "about") ? main.about.nume : ""
  );
  const [facultate, setFacultate] = useState(
    main && Object.hasOwn(main, "about") ? main.about.facultate : ""
  );
  const [spec, setSpec] = useState(
    main && Object.hasOwn(main, "about") ? main.about.specializare : ""
  );
  const [an, setAn] = useState(
    main && Object.hasOwn(main, "about") ? main.about.an : 0
  );
  const [update_er, setUpdateErr] = useState("");

  const update = async () => {
    setLoadingUpdate(true);
    if (nume !== "" || main.about.nume !== "") {
      setUpdateErr("");

      if (file) {
        const storage = getStorage();

        const storageRef = ref(storage, `cv/${file.name}`);

        try {
          await uploadBytes(storageRef, file);
          const url = await getDownloadURL(storageRef);
          console.log(url);
          setLink(url);
          QRCode.toDataURL(url).then(async (res) => {
            setR(res);
            await fire
              .updateData(`/targ_users/${main.id}`, {
                cv: url,
                qr: res,
                about: { nume, facultate, specializare: spec, an: Number(an) },
              })
              .then(async (res) => {
                setIsUpdated(true);
                setModi(false);
                console.log(res);
                if (user) {
                  await fire
                    .getUserByEmail2("/targ_users", user.email)
                    .then(async (res) => {
                      console.log("res: ", res);
                      console.log("ress: ", Object.keys(res)[0]);
                      setUser({
                        ...Object.values(res)[0],
                        id: Object.keys(res)[0],
                      });
                    });
                }
              });
          });
        } catch (error) {
          alert(error);
        }
      } else {
        console.log("plm");
      }
      if (modi) {
        console.log({
          about: { nume, facultate, specializare: spec, an: Number(an) },
        });
        await fire
          .updateData(`/targ_users/${main.id}`, {
            about: { nume, facultate, specializare: spec, an: Number(an) },
          })
          .then(async (res) => {
            setIsUpdated(true);
            setModi(false);
            console.log("din rasp", {
              about: { nume, facultate, specializare: spec, an: Number(an) },
            });
            if (user) {
              await fire
                .getUserByEmail2("/targ_users", user.email)
                .then(async (res) => {
                  console.log("res: ", res);
                  console.log("ress: ", Object.keys(res)[0]);
                  setUser({
                    ...Object.values(res)[0],
                    id: Object.keys(res)[0],
                  });
                });
            }
          });
      }
    } else {
      setUpdateErr("Numele este obligatoriu!");
    }
    setLoadingUpdate(false);
  };
  const [loading_final, setLoadingFinal] = useState(false);
  const [err, setErr] = useState("");
  const final_stand = async () => {
    setLoadingFinal(true);
    if (typeof myStand == "undefined") {
      setErr("Trebuie sa alegi un stand!");
      setLoadingFinal(false);
      return;
    }
    // console.log("my:", myStand);
    if (
      window.confirm(
        "Acesta va ramane standul dvs.! Nu il veti mai putea schimba! Doriti sa continuati?"
      )
    ) {
      await fire
        .updateData(`/targ_users/${main.id}`, {
          final: true,
        })
        .then((res) => {
          setFinal(true);
          setLoadingFinal(false);
        });
    } else {
      setLoadingFinal(false);
    }
  };
  const download = () => {
    var element = document.createElement("a");
    var file = new Blob(
      [
        "https://timesofindia.indiatimes.com/thumb/msid-70238371,imgsize-89579,width-400,resizemode-4/70238371.jpg",
      ],
      { type: "image/*" }
    );
    element.href = URL.createObjectURL(file);
    element.download = "image.jpg";
    element.click();
  };

  const [loading_download, setLoadingDownload] = useState(false);
  const downloadFiles = async () => {
    setLoadingDownload(true);
    if (user) {
      await fire
        .getUserByEmail2("/targ_users", user.email)
        .then(async (res) => {
          console.log(Object.values(res)[0].cvs.map((i) => i.cv));
          let i = 0;
          console.log(Object.values(res)[0].cvs.length);
          for (const link of Object.values(res)[0].cvs) {
            saveAs(link.cv);

            // await axios.get(link.cv).then((res) => {
            //   fileDownload(res.data, `cv -${i}.pdf`);
            // });
            i++;
          }
        });
    }
    setLoadingDownload(false);
  };

  return (
    <>
      {loadingState ? (
        <div className="loading">
          <div className="loader"></div>
        </div>
      ) : (
        <>
          <div className="profile">
            <nav>
              <h1>OSFIIR</h1>
              {/* <button
                onClick={() => {
                  console.log(nume, facultate, spec, an);
                  console.log(main.about);
                }}
              >
                check
              </button> */}
              {/* <img src={require("../assets/img/logo.png")} alt="" /> */}
            </nav>
            {/* <button
              onClick={async () => {
                await fire.addCVToDocument(`/targ_users/${main.id}`, {
                  ok: Math.random() * 900,
                });
              }}
            >
              check
            </button>
            <br />
            <br />
            <br />
            <br /> */}

            {user && main && main.rol == "user" ? (
              <>
                {!isUpdated ? (
                  <div className="form">
                    <div className="input_field">
                      <h3>Nume si prenume</h3>
                      <input
                        type="text"
                        placeholder="ex: Dragutu Matei"
                        defaultValue={
                          Object.hasOwn(main, "about") ? main.about.nume : ""
                        }
                        onChange={(e) => setNume(e.target.value)}
                      />
                    </div>
                    <div className="input_field">
                      <h3>Facultate</h3>
                      <input
                        onChange={(e) => setFacultate(e.target.value)}
                        defaultValue={
                          Object.hasOwn(main, "about")
                            ? main.about.facultate
                            : ""
                        }
                        type="text"
                        placeholder="ex: Facultatea de Inginerie Industriala si Robotica"
                      />
                    </div>{" "}
                    <div className="input_field">
                      <h3>Specializarea</h3>
                      <input
                        onChange={(e) => setSpec(e.target.value)}
                        defaultValue={
                          Object.hasOwn(main, "about")
                            ? main.about.specializare
                            : ""
                        }
                        type="text"
                        placeholder="ex: Informatica Aplicata"
                      />
                    </div>
                    <div className="input_field">
                      <h3>An</h3>
                      <input
                        type="number"
                        defaultValue={
                          Object.hasOwn(main, "about") && main.about.an
                        }
                        onChange={(e) => setAn(e.target.value)}
                        placeholder="ex: 1"
                      />
                    </div>
                    <div className="input_field">
                      <h3>CV</h3>
                      <input
                        type="file"
                        onChange={(e) => {
                          setFile(e.target.files[0]);
                        }}
                      />
                    </div>
                    {update_er && <h4>{update_er}</h4>}
                    {loadingUpdate ? (
                      <div className="loaderUpdate"></div>
                    ) : (
                      <svg
                        onClick={update}
                        clipRule="evenodd"
                        fillRule="evenodd"
                        strokeLinejoin="round"
                        strokeMiterlimit="2"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="m12.007 2c-5.518 0-9.998 4.48-9.998 9.998 0 5.517 4.48 9.997 9.998 9.997s9.998-4.48 9.998-9.997c0-5.518-4.48-9.998-9.998-9.998zm1.523 6.21s1.502 1.505 3.255 3.259c.147.147.22.339.22.531s-.073.383-.22.53c-1.753 1.754-3.254 3.258-3.254 3.258-.145.145-.335.217-.526.217-.192-.001-.384-.074-.531-.221-.292-.293-.294-.766-.003-1.057l1.977-1.977h-6.693c-.414 0-.75-.336-.75-.75s.336-.75.75-.75h6.693l-1.978-1.979c-.29-.289-.287-.762.006-1.054.147-.147.339-.221.53-.222.19 0 .38.071.524.215z"
                          fillRule="nonzero"
                          fill="#5bc0eb"
                        />
                      </svg>
                    )}
                  </div>
                ) : (
                  <>
                    <h1>
                      Welcome
                      <br />
                      <span>
                        {nume ? nume : main.about.nume}
                        <svg
                          onClick={() => {
                            setIsUpdated(false);
                            setModi(true);
                            console.log({
                              nume,
                              facultate,
                              specializare: spec,
                              an: Number(an),
                            });
                          }}
                          clipRule="evenodd"
                          fillRule="evenodd"
                          stroke-linejoin="round"
                          stroke-miterlimit="2"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="m9.134 19.319 11.587-11.588c.171-.171.279-.423.279-.684 0-.229-.083-.466-.28-.662l-3.115-3.104c-.185-.185-.429-.277-.672-.277s-.486.092-.672.277l-11.606 11.566c-.569 1.763-1.555 4.823-1.626 5.081-.02.075-.029.15-.029.224 0 .461.349.848.765.848.511 0 .991-.189 5.369-1.681zm-3.27-3.342 2.137 2.137-3.168 1.046zm.955-1.166 10.114-10.079 2.335 2.327-10.099 10.101z"
                            fillRule="nonzero"
                            fill="#fbfef9"
                          />
                        </svg>
                      </span>
                    </h1>
                    {r && <img src={r} alt="" />}
                  </>
                )}
              </>
            ) : (
              <>
                {/* <button
                  onClick={() => {
                    console.log(occ);
                    console.log(myStand);
                  }}
                >
                  see
                </button> */}
                <div className="company">
                  {!final ? (
                    <>
                      <h3>Alege un stand</h3>
                      <div className="fiir">
                        {Array.from({ length: 24 }).map((_, i) => {
                          return (
                            <>
                              <button
                                key={i}
                                className="stand"
                                disabled={occ.includes(i) || myStand >= 0}
                                style={{
                                  background: occ.includes(i) && "red",
                                }}
                                onClick={() => save(i, main.email)}
                              ></button>
                              {myStand == i && occ.includes(i) && (
                                <h3 onClick={() => uita_stand(i)}>
                                  delete this
                                </h3>
                              )}
                            </>
                          );
                        })}
                      </div>
                      {err && <h4>{err}</h4>}
                      {loading_final ? (
                        <div className="loaderUpdate"></div>
                      ) : (
                        <svg
                          onClick={final_stand}
                          clipRule="evenodd"
                          fillRule="evenodd"
                          strokeLinejoin="round"
                          strokeMiterlimit="2"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="m12.007 2c-5.518 0-9.998 4.48-9.998 9.998 0 5.517 4.48 9.997 9.998 9.997s9.998-4.48 9.998-9.997c0-5.518-4.48-9.998-9.998-9.998zm1.523 6.21s1.502 1.505 3.255 3.259c.147.147.22.339.22.531s-.073.383-.22.53c-1.753 1.754-3.254 3.258-3.254 3.258-.145.145-.335.217-.526.217-.192-.001-.384-.074-.531-.221-.292-.293-.294-.766-.003-1.057l1.977-1.977h-6.693c-.414 0-.75-.336-.75-.75s.336-.75.75-.75h6.693l-1.978-1.979c-.29-.289-.287-.762.006-1.054.147-.147.339-.221.53-.222.19 0 .38.071.524.215z"
                            fillRule="nonzero"
                            fill="#5bc0eb"
                          />
                        </svg>
                      )}
                    </>
                  ) : (
                    <>
                      <div
                        id="reader"
                        style={{ width: "80%", margin: "0 auto" }}
                      ></div>
                      {suuc && <h3>{suuc}</h3>}
                      <div className="download">
                        <button onClick={() => downloadFiles()}>
                          {loading_download ? (
                            <div className="loaderUpdate"></div>
                          ) : (
                            "Download all CVs"
                          )}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </>
            )}
            <br />
            <div className="logout">
              <button
                onClick={async () => {
                  await fire.logout();
                }}
              >
                logout
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}

export default Profile;
